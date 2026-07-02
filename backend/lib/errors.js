class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AccessDeniedError extends Error {
  constructor(message = 'Zugriff verweigert') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Nicht gefunden') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

class GoneError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoneError';
  }
}

module.exports = { ValidationError, AccessDeniedError, NotFoundError, ConflictError, GoneError };
