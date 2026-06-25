import {
  OPERATIONAL_STATUS_CONSTANTS,
  OPERATIONAL_STATUS_SCHEMA_VERSION,
  operationalStatusCapabilityMatrix
} from "./domain/operational-status.mjs";

export const productStatus = Object.freeze({
  schema_version: OPERATIONAL_STATUS_SCHEMA_VERSION,
  product_name: OPERATIONAL_STATUS_CONSTANTS.product_name,
  repository: OPERATIONAL_STATUS_CONSTANTS.repository,
  maturity: OPERATIONAL_STATUS_CONSTANTS.maturity,
  implementation_status: OPERATIONAL_STATUS_CONSTANTS.implementation_status,
  runtime: Object.freeze({
    name: OPERATIONAL_STATUS_CONSTANTS.runtime.name,
    minimum_version: OPERATIONAL_STATUS_CONSTANTS.runtime.minimum_version
  }),
  version: "0.0.0",
  capabilities: operationalStatusCapabilityMatrix()
});

export function getStatus() {
  return productStatus;
}

export function statusJson() {
  return `${JSON.stringify(productStatus, null, 2)}\n`;
}