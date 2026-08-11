import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Valida CPF brasileiro
 * Remove formatação e valida algoritmo de dígito verificador
 */
@ValidatorConstraint({ name: 'isCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // Remove caracteres especiais
    const cpf = value.replace(/\D/g, '');

    // Valida tamanho
    if (cpf.length !== 11) return false;

    // Rejeita CPFs conhecidos como inválidos
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    let resto: number;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  }

  defaultMessage(): string {
    return 'CPF inválido';
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}

/**
 * Valida email mais rigorosamente
 */
@ValidatorConstraint({ name: 'isEmail', async: false })
export class IsEmailConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) && value.length <= 254;
  }

  defaultMessage(): string {
    return 'Email inválido';
  }
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailConstraint,
    });
  };
}

/**
 * Valida data de nascimento (não pode ser futura, nem antes de 1900)
 */
@ValidatorConstraint({ name: 'isValidBirthDate', async: false })
export class IsValidBirthDateConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value) return true; // allowing optional

    const date = new Date(value);
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    const minDate = new Date('1900-01-01');

    return date >= minDate && date <= now;
  }

  defaultMessage(): string {
    return 'Data de nascimento inválida (deve estar entre 1900 e hoje)';
  }
}

export function IsValidBirthDate(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBirthDateConstraint,
    });
  };
}

/**
 * Valida telefone brasileiro
 */
@ValidatorConstraint({ name: 'isPhoneBR', async: false })
export class IsPhoneBRConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    const phone = value.replace(/\D/g, '');
    // Formato: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX = 10 ou 11 dígitos
    return phone.length === 10 || phone.length === 11;
  }

  defaultMessage(): string {
    return 'Telefone inválido (formato esperado: (XX) 9XXXX-XXXX)';
  }
}

export function IsPhoneBR(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneBRConstraint,
    });
  };
}
