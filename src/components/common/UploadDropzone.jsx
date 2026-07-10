function UploadDropzone({
  helperText,
  label,
  title = 'Drop file or browse',
}) {
  return (
    <div>
      {label ? <p className="upload-dropzone__label">{label}</p> : null}

      <div className="upload-dropzone">
        <p className="upload-dropzone__title">{title}</p>
        {helperText ? (
          <p className="upload-dropzone__description">{helperText}</p>
        ) : null}
      </div>
    </div>
  );
}

export default UploadDropzone;
