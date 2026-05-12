export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, error: 'Email is required' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return { valid: false, error: 'Please enter a valid email address' }
  return { valid: true }
}

export function validatePassword(password: string, minLength = 8): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' }
  if (password.length < minLength) return { valid: false, error: `Password must be at least ${minLength} characters` }
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Must contain an uppercase letter' }
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Must contain a lowercase letter' }
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Must contain a number' }
  return { valid: true }
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone.trim()) return { valid: true }
  const re = /^\+?[0-9]{7,15}$/
  if (!re.test(phone)) return { valid: false, error: 'Please enter a valid phone number' }
  return { valid: true }
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: `${fieldName} is required` }
  return { valid: true }
}

export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' }
  return { valid: true }
}

export function validateName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, error: 'Name is required' }
  if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' }
  return { valid: true }
}
