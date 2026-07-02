const STATUS_BY_ERROR_NAME = {
  ValidationError: 400,
  AccessDeniedError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  GoneError: 410
};

function handleServiceError(error, res, logPrefix) {
  const status = STATUS_BY_ERROR_NAME[error.name];
  if (status) {
    return res.status(status).json({ error: error.message });
  }
  console.error(logPrefix || 'Service error:', error);
  return res.status(500).json({ error: 'Interner Serverfehler' });
}

module.exports = { handleServiceError };
