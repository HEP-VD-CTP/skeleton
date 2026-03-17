
export function name(mandatoryMessage: string, maxLengthMessage: string) {
  return [
    (v: string) => !!v || mandatoryMessage,
    (v: string) => v.length <= 255 || maxLengthMessage,
  ]
}

export function description(mandatoryMessage: string, maxLengthMessage: string) {
  return [
    (v: string) => !!v || mandatoryMessage,
    (v: string) => v.length <= 65535 || maxLengthMessage,
  ]
}

export function email(mandatoryMessage: string, maxLengthMessage: string, validMessage: string) {
  return [
    (v: string) => !!v || mandatoryMessage,
    (v: string) => v.length <= 255 || maxLengthMessage,
    (v: string) => {
      if (v.indexOf('@') === -1 || v.indexOf('.') === -1) 
        return validMessage
      
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) || validMessage
    }
  ]
}

export function pwd(mandatoryMessage: string, lengthMessage: string) {
  return [
    (v: string) => !!v || mandatoryMessage,
    (v: string) => v.length >= 6 && v.length <= 255 || lengthMessage,    
  ]
}

export default {
  name,
  description,
  email,
  pwd
}