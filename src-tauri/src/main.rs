// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![read_stellaris_colors])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn read_stellaris_colors() -> String {
  let path = get_stellaris_dir().join("common").join("named_colors").join("00_basic_colors.txt");
  println!("path: {}", path.display());
  return fs::read_to_string(path).unwrap();
}

fn get_stellaris_dir() -> PathBuf {
  match env::consts::OS {
    "linux" => {
      let home_dir = env::var("HOME").unwrap();
      return Path::new(home_dir.as_str()).join(".steam/root/steamapps/common/Stellaris");
    }
    "macos" => {
      let home_dir = env::var("HOME").unwrap();
      return Path::new(home_dir.as_str()).join("Library/Application Support/Steam/steamapps/common/Stellaris");
    }
    "windows" => {
      return Path::new("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stellaris").to_path_buf();
    }
    _ => panic!("unsupported OS")
  }
}