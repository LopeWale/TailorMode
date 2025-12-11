export class OrganizationNotFoundError extends Error {
  constructor(slug: string) {
    super(`Organization with slug '${slug}' was not found`);
    this.name = "OrganizationNotFoundError";
  }
}

export class CaptureSessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Capture session with id '${id}' was not found`);
    this.name = "CaptureSessionNotFoundError";
  }
}

export class CaptureSessionOwnershipError extends Error {
  constructor(id: string) {
    super(`Capture session '${id}' does not belong to the target organization`);
    this.name = "CaptureSessionOwnershipError";
  }
}
