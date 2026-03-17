
export class BadRequestException extends Error {
    status: number
  
    constructor(message: string){
      super(`InvalidRequestException: ${message}`)
      this.name = `InvalidRequestException`
      this.status = 400
    }
  }
  
  export class UnauthorizedException extends Error {
    status: number
    
    constructor(message: string){
      super(`UnauthorizedException: ${message}`)
      this.name = `UnauthorizedException`
      this.status = 401
    }
  
  }
  export class ForbiddenException extends Error {
    status: number
    
    constructor(message: string){
      super(`ForbiddenException: ${message}`)
      this.name = `ForbiddenException`
      this.status = 403
    }
  }
  
  export class NotFoundException extends Error {
    status: number
    
    constructor(message: string){
      super(`NotFoundException: ${message}`)
      this.name = `NotFoundException`
      this.status = 404
    }
  }
  
  export class ConflictException extends Error {
    status: number
    
    constructor(message: string){
      super(`ConflictException: ${message}`)
      this.name = `ConflictException`
      this.status = 409
    }
  }

  export class ContentTooLargeException extends Error {
    status: number
    
    constructor(message: string){
      super(`ContentTooLargeException: ${message}`)
      this.name = `ContentTooLargeException`
      this.status = 413
    }
  }
  
  export default {
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    ContentTooLargeException
  }