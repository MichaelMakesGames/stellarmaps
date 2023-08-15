// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::Path;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![read_stellaris_colors])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn read_stellaris_colors() -> String {
  let home_dir = env::var("HOME").unwrap();
  let path = Path::new(home_dir.as_str()).join(".steam/root/steamapps/common/Stellaris/common/named_colors/00_basic_colors.txt");
  println!("path: {}", path.display());
  return fs::read_to_string(path).unwrap();
}