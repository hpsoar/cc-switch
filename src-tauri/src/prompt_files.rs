use std::path::PathBuf;

use crate::app_config::AppType;
use crate::app_registry::get_prompt_base_dir_for_app;
use crate::error::AppError;

/// 返回指定应用所使用的提示词文件路径。
pub fn prompt_file_path(app: &AppType) -> Result<PathBuf, AppError> {
    let base_dir = get_prompt_base_dir_for_app(app)?;
    Ok(base_dir.join(app.prompt_filename()))
}
