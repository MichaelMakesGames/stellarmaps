// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow;
use base64::prelude::*;
use ddsfile::Dds;
use font_kit::source::SystemSource;
use image_dds;
use regex::Regex;
use std::collections::HashMap;
use std::env;
use std::ffi::OsString;
use std::fs;
use std::io::{self, BufRead, Cursor};
use std::io::Read;
use std::path::Path;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;
use steamlocate::SteamDir;
use zip;

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			get_stellaris_colors_cmd,
			get_stellaris_loc_cmd,
			get_stellaris_install_dir_cmd,
			get_stellaris_save_metadata_cmd,
			get_stellaris_save_cmd,
			get_emblem_cmd,
			get_fonts_cmd,
			reveal_file_cmd
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
async fn get_stellaris_colors_cmd(path: String) -> Result<Vec<String>, String> {
	let paths = get_stellaris_data_paths(
		Path::new(&path).to_path_buf(),
		Path::new("flags").to_path_buf(),
		FileFilter::Name(OsString::from("colors.txt")),
		1,
	);
	if paths.is_empty() {
		return Err(String::from("No color files found"));
	}
	let data = paths
		.into_iter()
		.map(|p| fs::read_to_string(p).map_err(|err| err.to_string()))
		.collect();
	return data;
}

#[tauri::command]
async fn get_stellaris_loc_cmd(path: String) -> Result<HashMap<String, String>, String> {
	return get_stellaris_loc(path).map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_stellaris_save_metadata_cmd() -> Result<Vec<Vec<StellarisSave>>, String> {
	get_stellaris_save_metadata().map_err(|err| err.to_string())
}

#[tauri::command]
async fn get_stellaris_save_cmd(path: String) -> Result<String, String> {
	return get_stellaris_save(path).map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_emblem_cmd(path: String, category: String, file: String) -> Result<String, String> {
	return get_emblem(Path::new(&path).to_path_buf(), category, file).map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_fonts_cmd() -> Result<Vec<String>, String> {
	return get_fonts().map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_stellaris_install_dir_cmd() -> Result<String, String> {
	return get_stellaris_install_dir()
		.and_then(|path| Ok(path.to_string_lossy().into_owned()))
		.map_err(|err| err.to_string());
}

#[tauri::command]
async fn reveal_file_cmd(path: String) {
	let _ = opener::reveal(path);
}

fn get_steam_dir() -> anyhow::Result<PathBuf> {
	return Ok(SteamDir::locate()?.path().to_path_buf());
}

fn get_stellaris_install_dir() -> anyhow::Result<PathBuf> {
	let steamdir = SteamDir::locate()?;
	let (app, lib) = steamdir
		.find_app(281990)?
		.ok_or(anyhow::anyhow!("Stellaris Steam install not found"))?;
	let path = lib.resolve_app_dir(&app);
	if path.exists() {
		return Ok(path);
	} else {
		anyhow::bail!("Stellaris path does not exist: {}", path.display());
	}
}

fn get_stellaris_user_data_dir() -> PathBuf {
	match env::consts::OS {
		"linux" => {
			let home_dir = env::var("HOME").unwrap();
			return Path::new(home_dir.as_str()).join(".local/share/Paradox Interactive/Stellaris");
		}
		"macos" => {
			return tauri::api::path::document_dir()
				.unwrap()
				.join("Paradox Interactive/Stellaris");
		}
		"windows" => {
			return tauri::api::path::document_dir()
				.unwrap()
				.join("Paradox Interactive\\Stellaris");
		}
		_ => panic!("unsupported OS"),
	}
}

fn get_steam_user_data_dirs() -> anyhow::Result<Vec<PathBuf>> {
	let steam_user_data_dir = get_steam_dir()?.join("userdata");
	return get_sub_dirs(&steam_user_data_dir);
}

fn get_mod_path(enabled_mod: &serde_json::Value) -> anyhow::Result<PathBuf> {
	let user_data_dir = get_stellaris_user_data_dir();
	let enabled_mod_descriptor = user_data_dir.join(
		enabled_mod
			.as_str()
			.ok_or(anyhow::anyhow!("Expected enabled_mods to be string array"))?,
	);
	let enabled_mod_descriptor = fs::File::open(enabled_mod_descriptor)?;
	let enabled_mod_descriptor = io::read_to_string(enabled_mod_descriptor)?;
	let path_re = Regex::new(r#"(?m)^path="(.*)"$"#).unwrap();
	let mod_path = path_re
		.captures(&enabled_mod_descriptor)
		.map(|c| c.extract::<1>().1[0].to_string())
		.unwrap_or_default();
	return Ok(Path::new(&mod_path).to_path_buf());
}

fn get_enabled_mod_dirs() -> anyhow::Result<Vec<PathBuf>> {
	let user_data_dir = get_stellaris_user_data_dir();
	let dlc_load = user_data_dir.join("dlc_load.json");
	let dlc_load = fs::File::open(dlc_load)?;
	let dlc_load: serde_json::Value = serde_json::from_reader(dlc_load)?;
	let enabled_mods = dlc_load
		.get("enabled_mods")
		.ok_or(anyhow::anyhow!("Expected dlc_load to contain enabled_mods"))?;
	let mut mod_dirs = vec![];
	for enabled_mod in enabled_mods
		.as_array()
		.ok_or(anyhow::anyhow!("Expected enabled_mods to be string array"))?
	{
		match get_mod_path(enabled_mod) {
			Ok(mod_path) => mod_dirs.push(mod_path),
			_ => (),
		}
	}
	return Ok(mod_dirs);
}

fn get_stellaris_data_dirs(install_path: PathBuf) -> Vec<PathBuf> {
	let mut dirs = vec![install_path];
	match get_enabled_mod_dirs() {
		Ok(mod_dirs) => {
			for dir in mod_dirs {
				dirs.push(dir);
			}
		}
		_ => (),
	}
	return dirs;
}

fn get_sub_dirs(path: &PathBuf) -> anyhow::Result<Vec<PathBuf>> {
	let mut sub_dirs: Vec<PathBuf> = Vec::new();
	if path.is_dir() {
		for entry in fs::read_dir(path)? {
			let entry = entry?;
			let path = entry.path();
			if path.is_dir() {
				sub_dirs.push(path.to_path_buf());
			}
		}
	}
	Ok(sub_dirs)
}

enum FileFilter {
	Name(OsString),
	Extension(OsString),
}

fn get_files_matching_filter(
	path: &PathBuf,
	filter: &FileFilter,
	depth: u8,
) -> anyhow::Result<Vec<PathBuf>> {
	let mut files: Vec<PathBuf> = Vec::new();
	if path.is_dir() {
		for entry in fs::read_dir(path)? {
			let entry = entry?;
			let path = entry.path();
			if path.is_dir() && (depth > 1 || depth == 0) {
				let mut sub_dir_files = get_files_matching_filter(&path, filter, depth - 1)?;
				files.append(&mut sub_dir_files);
			} else {
				match filter {
					FileFilter::Name(filter_name) => match path.file_name() {
						Some(name) if name == filter_name => files.push(path),
						_ => (),
					},
					FileFilter::Extension(filter_ext) => match path.extension() {
						Some(ext) if ext == filter_ext => files.push(path),
						_ => (),
					},
				}
			}
		}
	}
	Ok(files)
}

fn get_stellaris_save(path: String) -> anyhow::Result<String> {
	let file = fs::File::open(path)?;
	let reader = io::BufReader::new(file);
	let mut archive = zip::ZipArchive::new(reader)?;
	let game_state_string = io::read_to_string(archive.by_name("gamestate")?)?;
	return Ok(game_state_string);
}

#[derive(serde::Serialize)]
struct StellarisSave {
	path: String,
	name: String,
	date: String,
	modified: u128,
}

impl StellarisSave {
	fn from_path(path: &PathBuf) -> anyhow::Result<Self> {
		let file = fs::File::open(path)?;
		let modified = file
			.metadata()?
			.modified()?
			.duration_since(UNIX_EPOCH)?
			.as_millis();
		let reader = io::BufReader::new(file);
		let mut archive = zip::ZipArchive::new(reader)?;
		let meta = archive.by_name("meta")?;
		let meta_string = io::read_to_string(meta)?;
		let name_re = Regex::new(r#"(?m)^name="(.*)"$"#).unwrap();
		let name = name_re
			.captures(&meta_string)
			.map(|c| c.extract::<1>().1[0].to_string())
			.unwrap_or_default();
		let date_re = Regex::new(r#"(?m)^date="(.*)"$"#).unwrap();
		let date = date_re
			.captures(&meta_string)
			.map(|c| c.extract::<1>().1[0].to_string())
			.unwrap_or_default();
		return Ok(StellarisSave {
			path: path.to_str().unwrap().to_string(),
			name,
			date,
			modified,
		});
	}

	fn from_path_or_default(path: &PathBuf) -> Self {
		return Self::from_path(path).unwrap_or(StellarisSave {
			path: path.to_str().unwrap().to_string(),
			name: String::new(),
			date: String::new(),
			modified: 0,
		});
	}
}

fn get_stellaris_save_metadata() -> anyhow::Result<Vec<Vec<StellarisSave>>> {
	let saves: Vec<Vec<StellarisSave>> = get_steam_user_data_dirs()
		.unwrap_or(Vec::new())
		.iter()
		.map(|path| path.join("281990").join("remote").join("save games"))
		.chain(std::iter::once(
			get_stellaris_user_data_dir().join("save games"),
		))
		.flat_map(|path| get_sub_dirs(&path).unwrap_or_default())
		.map(|path| {
			let files = Vec::from_iter(
				get_files_matching_filter(&path, &FileFilter::Extension(OsString::from("sav")), 1)
					.unwrap_or(Vec::new())
					.iter()
					.map(|path| StellarisSave::from_path_or_default(path)),
			);
			return files;
		})
		.collect();
	return Ok(saves);
}

fn get_stellaris_data_paths(
	install_path: PathBuf,
	data_relative_dir: PathBuf,
	filter: FileFilter,
	depth: u8,
) -> Vec<PathBuf> {
	let data_root_dirs = get_stellaris_data_dirs(install_path);
	let mut file_path_to_root_dir: HashMap<PathBuf, PathBuf> = HashMap::new();
	for data_root_dir in data_root_dirs {
		let dir = data_root_dir.join(&data_relative_dir);
		match get_files_matching_filter(&dir, &filter, depth) {
			Ok(files) => {
				for file in files {
					file_path_to_root_dir.insert(
						file
							.strip_prefix(&data_root_dir)
							.expect("data file is not descendant of data root dir")
							.to_path_buf(),
						data_root_dir.clone(),
					);
				}
			}
			_ => (),
		}
	}
	let mut entries: Vec<(PathBuf, PathBuf)> = file_path_to_root_dir.into_iter().collect();
	entries.sort_by(|a, b| a.0.cmp(&b.0));
	return entries
		.into_iter()
		.map(|(child, base)| base.join(child))
		.collect();
}

fn get_stellaris_loc(path: String) -> anyhow::Result<HashMap<String, String>> {
	let loc_file_paths = get_stellaris_data_paths(
		Path::new(&path).to_path_buf(),
		Path::new("localisation").to_path_buf(),
		FileFilter::Extension(OsString::from("yml")),
		8,
	);
	if loc_file_paths.is_empty() {
		return Err(anyhow::anyhow!("No localisation files found"));
	}
	let mut locs: HashMap<String, String> = HashMap::new();
	for path in loc_file_paths {
		let mut buf_reader = io::BufReader::new(fs::File::open(path)?);
		let mut first_line = String::new();
		let _ = buf_reader.read_line(&mut first_line)?;
		if first_line.contains("l_english") {
			let re = Regex::new(r#"(?m)^\s*([\w\.\-]+)\s*:\d*\s*"(.*)".*$"#).unwrap();
			let mut raw_content = String::new();
			let _ = buf_reader.read_to_string(&mut raw_content)?;
			for (_, [key, value]) in re.captures_iter(&raw_content).map(|c| c.extract()) {
				locs.insert(key.to_string(), value.to_string());
			}
		}
	}
	return Ok(locs);
}

fn get_emblem(install_path: PathBuf, category: String, file: String) -> anyhow::Result<String> {
	let mut dirs = get_stellaris_data_dirs(install_path).to_owned();
	dirs.reverse();
	for dir in dirs {
		let path = dir.join("flags").join(&category).join("map").join(&file);
		if path.exists() {
			let mut reader = std::fs::File::open(path)?;
			let dds = Dds::read(&mut reader)?;
			let img = image_dds::image_from_dds(&dds, 0)?;
			let mut bytes: Vec<u8> = Vec::new();
			img.write_to(&mut Cursor::new(&mut bytes), image::ImageOutputFormat::Png)?;
			return Ok(format!("data:image/png;base64,{}", BASE64_STANDARD.encode(bytes)));
		}
	}
	return Err(anyhow::anyhow!("No data dir contained emblem"));
}

fn get_fonts() -> anyhow::Result<Vec<String>> {
	let fonts = SystemSource::new().all_families()?;
	return Ok(fonts);
}
