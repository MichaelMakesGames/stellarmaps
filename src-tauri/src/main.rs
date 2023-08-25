// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::collections::HashMap;
use std::time::UNIX_EPOCH;
use std::io;
use zip;
use regex::Regex;
use anyhow;
use font_kit::source::SystemSource;

fn main() {
	tauri::Builder
		::default()
		.invoke_handler(
			tauri::generate_handler![
				get_stellaris_colors_cmd,
				get_stellaris_loc_cmd,
				get_stellaris_save_metadata_cmd,
				get_stellaris_save_cmd,
				get_emblem_cmd,
				get_fonts_cmd
			]
		)
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
async fn get_stellaris_colors_cmd() -> Result<String, String> {
	let path = get_stellaris_install_dir()
		.join("common")
		.join("named_colors")
		.join("00_basic_colors.txt");
	return fs::read_to_string(path).map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_stellaris_loc_cmd() -> Result<HashMap<String, String>, String> {
	return get_stellaris_loc().map_err(|err| err.to_string());
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
async fn get_emblem_cmd(category: String, file: String) -> Result<Vec<u8>, String> {
	return get_emblem(category, file).map_err(|err| err.to_string());
}

#[tauri::command]
async fn get_fonts_cmd() -> Result<Vec<String>, String> {
	return get_fonts().map_err(|err| err.to_string());
}

fn get_steam_dir() -> PathBuf {
	match env::consts::OS {
		"linux" => {
			let home_dir = env::var("HOME").unwrap();
			return Path::new(home_dir.as_str()).join(".steam/root");
		}
		"macos" => {
			let home_dir = env::var("HOME").unwrap();
			return Path::new(home_dir.as_str()).join("Library/Application Support/Steam");
		}
		"windows" => {
			return Path::new("C:\\Program Files (x86)\\Steam").to_path_buf();
		}
		_ => panic!("unsupported OS"),
	}
}

fn get_stellaris_install_dir() -> PathBuf {
	return get_steam_dir().join("steamapps").join("common").join("Stellaris");
}

fn get_stellaris_user_data_dir() -> PathBuf {
	match env::consts::OS {
		"linux" => {
			let home_dir = env::var("HOME").unwrap();
			return Path::new(home_dir.as_str()).join(".local/share/Paradox Interactive/Stellaris");
		}
		"macos" => {
			return tauri::api::path::document_dir().unwrap().join("Paradox Interactive/Stellaris");
		}
		"windows" => {
			return tauri::api::path::document_dir().unwrap().join("Paradox Interactive\\Stellaris");
		}
		_ => panic!("unsupported OS"),
	}
}

fn get_steam_user_data_dirs() -> anyhow::Result<Vec<PathBuf>> {
	let steam_user_data_dir = get_steam_dir().join("userdata");
	return get_sub_dirs(&steam_user_data_dir);
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

fn get_files_of_extension(
	path: &PathBuf,
	extension: &str,
	depth: u8
) -> anyhow::Result<Vec<PathBuf>> {
	let mut files: Vec<PathBuf> = Vec::new();
	if path.is_dir() {
		for entry in fs::read_dir(path)? {
			let entry = entry?;
			let path = entry.path();
			if path.is_dir() && (depth > 1 || depth == 0) {
				let mut sub_dir_files = get_files_of_extension(&path, extension, depth - 1)?;
				files.append(&mut sub_dir_files);
			} else {
				match path.extension() {
					Some(ext) if ext == extension => files.push(path),
					_ => (),
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
		let modified = file.metadata()?.modified()?.duration_since(UNIX_EPOCH)?.as_millis();
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
		.chain(std::iter::once(get_stellaris_user_data_dir().join("save games")))
		.flat_map(|path| get_sub_dirs(&path).unwrap_or_default())
		.map(|path| {
			let files = Vec::from_iter(
				get_files_of_extension(&path, "sav", 1)
					.unwrap_or(Vec::new())
					.iter()
					.map(|path| StellarisSave::from_path_or_default(path))
			);
			return files;
		})
		.collect();
	return Ok(saves);
}

fn get_stellaris_loc() -> anyhow::Result<HashMap<String, String>> {
	let install_dir = get_stellaris_install_dir();
	let loc_dir = install_dir.join("localisation").join("english");
	let loc_file_paths = get_files_of_extension(&loc_dir, "yml", 8)?;
	let mut locs: HashMap<String, String> = HashMap::new();
	for path in loc_file_paths {
		let re = Regex::new(r#"(?m)^\s*([\w\.\-]+)\s*:\d*\s*"(.*)".*$"#).unwrap();
		let raw_content = fs::read_to_string(path)?;
		for (_, [key, value]) in re.captures_iter(&raw_content).map(|c| c.extract()) {
			locs.insert(key.to_string(), value.to_string());
		}
	}
	return Ok(locs);
}

fn get_emblem(category: String, file: String) -> io::Result<Vec<u8>> {
	let path = get_stellaris_install_dir().join("flags").join(category).join("map").join(file);
	return fs::read(path);
}

fn get_fonts() -> anyhow::Result<Vec<String>> {
	let fonts = SystemSource::new().all_families()?;
	return Ok(fonts);
}
