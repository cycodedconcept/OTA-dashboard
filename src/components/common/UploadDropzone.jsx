function UploadDropzone({
  accept,
  disabled = false,
  files = [],
  helperText,
  inputId,
  label,
  multiple = false,
  onChange,
  title = 'Drop file or browse',
}) {
  const isInteractive = Boolean(inputId && onChange);
  const normalizedFiles = Array.isArray(files) ? files : [];
  const fileNames = normalizedFiles.map((file) => file?.name).filter(Boolean);

  return (
    <div>
      {label ? <p className="upload-dropzone__label">{label}</p> : null}

      {isInteractive ? (
        <label
          htmlFor={inputId}
          className={`upload-dropzone upload-dropzone--interactive ${
            disabled ? 'is-disabled' : ''
          }`}
        >
          <input
            id={inputId}
            type="file"
            className="upload-dropzone__input"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={onChange}
          />
          <p className="upload-dropzone__title">
            {fileNames.length > 0
              ? `${fileNames.length} file${fileNames.length === 1 ? '' : 's'} selected`
              : title}
          </p>
          {helperText ? (
            <p className="upload-dropzone__description">{helperText}</p>
          ) : null}
        </label>
      ) : (
        <div className="upload-dropzone">
          <p className="upload-dropzone__title">{title}</p>
          {helperText ? (
            <p className="upload-dropzone__description">{helperText}</p>
          ) : null}
        </div>
      )}

      {fileNames.length > 0 ? (
        <ul className="upload-dropzone__file-list">
          {fileNames.map((fileName, index) => (
            <li
              key={`${fileName}-${index}`}
              className="upload-dropzone__file-item"
            >
              {fileName}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default UploadDropzone;
