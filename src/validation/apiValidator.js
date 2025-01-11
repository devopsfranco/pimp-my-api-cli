import { ValidationError } from '../utils/errors.js';

export class ApiValidator {
  constructor() {
    this.requiredFields = ['openapi', 'info', 'paths'];
    this.supportedVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'];
  }

  validate(spec) {
    const errors = [];

    // Check required fields
    this.requiredFields.forEach(field => {
      if (!spec[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate OpenAPI version
    if (spec.openapi && !this.supportedVersions.includes(spec.openapi)) {
      errors.push(`Unsupported OpenAPI version: ${spec.openapi}. Supported versions: ${this.supportedVersions.join(', ')}`);
    }

    // Validate info object
    if (spec.info) {
      if (!spec.info.title) errors.push('Missing API title in info object');
      if (!spec.info.version) errors.push('Missing API version in info object');
    }

    // Validate paths
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        this.validatePath(path, pathItem, errors);
      });
    }

    // Validate components if present
    if (spec.components) {
      this.validateComponents(spec.components, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('API specification validation failed', errors);
    }

    return true;
  }

  validatePath(path, pathItem, errors) {
    const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    
    // Check if path has any valid methods
    const methods = Object.keys(pathItem).filter(key => validMethods.includes(key));
    if (methods.length === 0) {
      errors.push(`Path ${path} has no valid HTTP methods`);
      return;
    }

    // Validate each method
    methods.forEach(method => {
      this.validateOperation(path, method, pathItem[method], errors);
    });
  }

  validateOperation(path, method, operation, errors) {
    // Check for operation ID
    if (!operation.operationId) {
      errors.push(`Missing operationId for ${method.toUpperCase()} ${path}`);
    }

    // Validate responses
    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      errors.push(`No responses defined for ${method.toUpperCase()} ${path}`);
    }

    // Validate parameters
    if (operation.parameters) {
      operation.parameters.forEach(param => {
        this.validateParameter(param, path, method, errors);
      });
    }
  }

  validateParameter(param, path, method, errors) {
    const requiredFields = ['name', 'in'];
    requiredFields.forEach(field => {
      if (!param[field]) {
        errors.push(`Missing ${field} in parameter for ${method.toUpperCase()} ${path}`);
      }
    });

    if (param.required && !param.schema) {
      errors.push(`Required parameter ${param.name} has no schema defined for ${method.toUpperCase()} ${path}`);
    }
  }

  validateComponents(components, errors) {
    if (components.schemas) {
      Object.entries(components.schemas).forEach(([name, schema]) => {
        this.validateSchema(name, schema, errors);
      });
    }
  }

  validateSchema(name, schema, errors) {
    if (!schema.type && !schema.anyOf && !schema.oneOf && !schema.allOf) {
      errors.push(`Schema ${name} has no type definition`);
    }

    if (schema.required && !Array.isArray(schema.required)) {
      errors.push(`Schema ${name} has invalid required field (must be array)`);
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, prop]) => {
        if (!prop.type && !prop.anyOf && !prop.oneOf && !prop.allOf) {
          errors.push(`Property ${propName} in schema ${name} has no type definition`);
        }
      });
    }
  }
}
