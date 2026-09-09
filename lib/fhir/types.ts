// FHIR R4 core type definitions (subset relevant to this app)

export type FhirResourceType =
  | 'Patient'
  | 'Observation'
  | 'Condition'
  | 'Encounter'
  | 'MedicationRequest'
  | string;

export interface FhirReference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface FhirIdentifier {
  system?: string;
  value?: string;
  use?: string;
  type?: {
    coding?: { system?: string; code?: string; display?: string }[];
    text?: string;
  };
}

export interface FhirHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
  version?: string;
}

export interface FhirQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
  comparator?: string;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    profile?: string[];
    security?: FhirCoding[];
    tag?: FhirCoding[];
  };
  identifier?: FhirIdentifier[];
  [key: string]: unknown;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FhirAddress[];
  active?: boolean;
  contact?: {
    relationship?: FhirCodeableConcept[];
    name?: FhirHumanName;
    telecom?: FhirContactPoint[];
    address?: FhirAddress;
    gender?: string;
    period?: FhirPeriod;
  }[];
  managingOrganization?: FhirReference;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  status?: string;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueCodeableConcept?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  note?: { text: string }[];
}

export interface FhirCondition extends FhirResource {
  resourceType: 'Condition';
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  onsetAge?: { value?: number; unit?: string; code?: string };
  abatementDateTime?: string;
  recordedDate?: string;
  severity?: FhirCodeableConcept;
  note?: { text: string }[];
}

export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  status?: string;
  class?: FhirCoding;
  type?: FhirCodeableConcept[];
  priority?: FhirCodeableConcept;
  subject?: FhirReference;
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  diagnosis?: {
    condition: FhirReference;
    use?: FhirCodeableConcept;
  }[];
  serviceProvider?: FhirReference;
}

export interface FhirMedicationRequest extends FhirResource {
  resourceType: 'MedicationRequest';
  status?: string;
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  subject: FhirReference;
  encounter?: FhirReference;
  authoredOn?: string;
  requester?: FhirReference;
  dosageInstruction?: {
    text?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
      };
    };
    route?: FhirCodeableConcept;
    doseAndRate?: {
      type?: FhirCodeableConcept;
      doseQuantity?: FhirQuantity;
    }[];
  }[];
  dispenseRequest?: {
    validityPeriod?: FhirPeriod;
    numberOfRepeatsAllowed?: number;
    quantity?: FhirQuantity;
    expectedSupplyDuration?: FhirQuantity;
  };
}

export interface FhirBundle extends FhirResource {
  resourceType: 'Bundle';
  type: 'collection' | 'document' | 'message' | 'transaction' | 'batch' | 'history' | 'searchset';
  total?: number;
  entry?: {
    fullUrl?: string;
    resource?: FhirResource;
    search?: { mode?: string; score?: number };
  }[];
  link?: { relation: string; url: string }[];
}

export type IssueSeverity = 'fatal' | 'error' | 'warning' | 'information';
export type IssueCode =
  | 'invalid'
  | 'structure'
  | 'required'
  | 'value'
  | 'invariant'
  | 'security'
  | 'login'
  | 'unknown'
  | 'expired'
  | 'forbidden'
  | 'suppressed'
  | 'processing'
  | 'not-supported'
  | 'duplicate'
  | 'multiple-matches'
  | 'not-found'
  | 'deleted'
  | 'too-long'
  | 'code-invalid'
  | 'extension'
  | 'too-costly'
  | 'business-rule'
  | 'conflict'
  | 'transient'
  | 'lock-error'
  | 'no-store'
  | 'exception'
  | 'timeout'
  | 'incomplete'
  | 'throttled'
  | 'informational';

export interface FhirOperationOutcome extends FhirResource {
  resourceType: 'OperationOutcome';
  issue: {
    severity: IssueSeverity;
    code: IssueCode;
    details?: FhirCodeableConcept;
    diagnostics?: string;
    location?: string[];
    expression?: string[];
  }[];
}

export interface SmartConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  introspection_endpoint?: string;
  userinfo_endpoint?: string;
  grant_types_supported?: string[];
  scopes_supported?: string[];
  response_types_supported?: string[];
  capabilities?: string[];
  code_challenge_methods_supported?: string[];
}

export interface FhirCapabilityStatement {
  resourceType: 'CapabilityStatement';
  status: string;
  date: string;
  kind: string;
  fhirVersion: string;
  software?: { name: string; version: string };
  implementation?: { description: string; url: string };
  rest?: {
    mode: string;
    resource?: {
      type: string;
      interaction: { code: string }[];
      searchParam?: { name: string; type: string; definition?: string; documentation?: string }[];
    }[];
  }[];
}

export interface PaginationLinks {
  self?: string;
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
}
