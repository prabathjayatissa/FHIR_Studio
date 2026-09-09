import type { FhirResource, FhirBundle, FhirCapabilityStatement, FhirOperationOutcome, FhirResourceType, PaginationLinks } from './types';
import { FhirClient, FhirClientConfig, SearchResult, FhirError } from './client';

// Sample FHIR R4 resources for demo mode (no network required)

const DEMO_RESOURCES: FhirResource[] = [
  {
    resourceType: 'Patient',
    id: 'demo-pat-1',
    meta: { versionId: '1', lastUpdated: '2024-01-15T10:30:00Z' },
    identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-001234' }],
    name: [{ use: 'official', family: 'Smith', given: ['John', 'Michael'], prefix: ['Mr.'] }],
    telecom: [
      { system: 'phone', value: '555-0100', use: 'home' },
      { system: 'email', value: 'john.smith@example.com' },
    ],
    gender: 'male',
    birthDate: '1985-03-15',
    address: [{ use: 'home', line: ['123 Main Street'], city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' }],
    active: true,
  },
  {
    resourceType: 'Patient',
    id: 'demo-pat-2',
    meta: { versionId: '1', lastUpdated: '2024-02-20T14:00:00Z' },
    identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-005678' }],
    name: [{ use: 'official', family: 'Johnson', given: ['Emily', 'Rose'], prefix: ['Ms.'] }],
    telecom: [
      { system: 'phone', value: '555-0200', use: 'mobile' },
      { system: 'email', value: 'emily.johnson@example.com' },
    ],
    gender: 'female',
    birthDate: '1992-07-22',
    address: [{ use: 'home', line: ['456 Oak Avenue'], city: 'Portland', state: 'OR', postalCode: '97201', country: 'USA' }],
    active: true,
  },
  {
    resourceType: 'Patient',
    id: 'demo-pat-3',
    meta: { versionId: '2', lastUpdated: '2024-03-10T09:15:00Z' },
    identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-009012' }],
    name: [{ use: 'official', family: 'Williams', given: ['Robert'], prefix: ['Mr.'] }],
    telecom: [{ system: 'phone', value: '555-0300', use: 'home' }],
    gender: 'male',
    birthDate: '1970-11-05',
    address: [{ use: 'home', line: ['789 Pine Road'], city: 'Austin', state: 'TX', postalCode: '73301', country: 'USA' }],
    active: true,
  },
  {
    resourceType: 'Patient',
    id: 'demo-pat-4',
    meta: { versionId: '1', lastUpdated: '2024-04-05T11:45:00Z' },
    identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-003456' }],
    name: [{ use: 'official', family: 'Davis', given: ['Sarah'], prefix: ['Ms.'] }],
    telecom: [{ system: 'phone', value: '555-0400', use: 'work' }],
    gender: 'female',
    birthDate: '1998-12-30',
    address: [{ use: 'home', line: ['321 Elm Street'], city: 'Denver', state: 'CO', postalCode: '80201', country: 'USA' }],
    active: true,
  },
  {
    resourceType: 'Observation',
    id: 'demo-obs-1',
    meta: { versionId: '1', lastUpdated: '2024-05-01T08:00:00Z' },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' },
    subject: { reference: 'Patient/demo-pat-1', display: 'John Smith' },
    effectiveDateTime: '2024-05-01T08:00:00Z',
    valueQuantity: { value: 72, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' },
  },
  {
    resourceType: 'Observation',
    id: 'demo-obs-2',
    meta: { versionId: '1', lastUpdated: '2024-05-01T08:05:00Z' },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }], text: 'Blood pressure' },
    subject: { reference: 'Patient/demo-pat-1', display: 'John Smith' },
    effectiveDateTime: '2024-05-01T08:05:00Z',
    valueQuantity: { value: 120, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
  },
  {
    resourceType: 'Observation',
    id: 'demo-obs-3',
    meta: { versionId: '1', lastUpdated: '2024-05-02T14:00:00Z' },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' },
    subject: { reference: 'Patient/demo-pat-2', display: 'Emily Johnson' },
    effectiveDateTime: '2024-05-02T14:00:00Z',
    valueQuantity: { value: 80, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' },
  },
  {
    resourceType: 'Observation',
    id: 'demo-obs-4',
    meta: { versionId: '1', lastUpdated: '2024-05-03T10:00:00Z' },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '2339-0', display: 'Glucose' }], text: 'Blood glucose' },
    subject: { reference: 'Patient/demo-pat-3', display: 'Robert Williams' },
    effectiveDateTime: '2024-05-03T10:00:00Z',
    valueQuantity: { value: 95, unit: 'mg/dL', system: 'http://unitsofmeasure.org', code: 'mg/dL' },
  },
  {
    resourceType: 'Observation',
    id: 'demo-obs-5',
    meta: { versionId: '1', lastUpdated: '2024-05-04T07:30:00Z' },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Weight' },
    subject: { reference: 'Patient/demo-pat-4', display: 'Sarah Davis' },
    effectiveDateTime: '2024-05-04T07:30:00Z',
    valueQuantity: { value: 62, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
  },
  {
    resourceType: 'Condition',
    id: 'demo-cond-1',
    meta: { versionId: '1', lastUpdated: '2024-03-20T09:00:00Z' },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] },
    code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }], text: 'Hypertension' },
    subject: { reference: 'Patient/demo-pat-1', display: 'John Smith' },
    onsetDateTime: '2023-01-10T00:00:00Z',
    recordedDate: '2023-01-15T10:00:00Z',
    severity: { coding: [{ system: 'http://snomed.info/sct', code: '6736007', display: 'Moderate' }] },
  },
  {
    resourceType: 'Condition',
    id: 'demo-cond-2',
    meta: { versionId: '1', lastUpdated: '2024-04-12T13:30:00Z' },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] },
    code: { coding: [{ system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus' }], text: 'Diabetes mellitus type 2' },
    subject: { reference: 'Patient/demo-pat-3', display: 'Robert Williams' },
    onsetDateTime: '2022-06-01T00:00:00Z',
    recordedDate: '2022-06-10T09:00:00Z',
    severity: { coding: [{ system: 'http://snomed.info/sct', code: '6736007', display: 'Moderate' }] },
  },
  {
    resourceType: 'Condition',
    id: 'demo-cond-3',
    meta: { versionId: '1', lastUpdated: '2024-02-28T11:00:00Z' },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'resolved', display: 'Resolved' }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] },
    code: { coding: [{ system: 'http://snomed.info/sct', code: '10509002', display: 'Acute bronchitis' }], text: 'Acute bronchitis' },
    subject: { reference: 'Patient/demo-pat-2', display: 'Emily Johnson' },
    onsetDateTime: '2024-01-20T00:00:00Z',
    abatementDateTime: '2024-02-10T00:00:00Z',
    recordedDate: '2024-01-22T14:00:00Z',
  },
  {
    resourceType: 'Encounter',
    id: 'demo-enc-1',
    meta: { versionId: '1', lastUpdated: '2024-05-01T07:30:00Z' },
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '185349003', display: 'Encounter for check up' }], text: 'Annual check-up' }],
    subject: { reference: 'Patient/demo-pat-1', display: 'John Smith' },
    period: { start: '2024-05-01T07:30:00Z', end: '2024-05-01T08:30:00Z' },
  },
  {
    resourceType: 'Encounter',
    id: 'demo-enc-2',
    meta: { versionId: '1', lastUpdated: '2024-05-02T13:00:00Z' },
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '11429006', display: 'Consultation' }], text: 'Follow-up consultation' }],
    subject: { reference: 'Patient/demo-pat-2', display: 'Emily Johnson' },
    period: { start: '2024-05-02T13:00:00Z', end: '2024-05-02T13:45:00Z' },
  },
  {
    resourceType: 'Encounter',
    id: 'demo-enc-3',
    meta: { versionId: '1', lastUpdated: '2024-05-03T09:00:00Z' },
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'Emergency' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '50849002', display: 'Emergency room admission' }], text: 'ER visit' }],
    subject: { reference: 'Patient/demo-pat-3', display: 'Robert Williams' },
    period: { start: '2024-05-03T09:00:00Z', end: '2024-05-03T14:00:00Z' },
  },
  {
    resourceType: 'MedicationRequest',
    id: 'demo-med-1',
    meta: { versionId: '1', lastUpdated: '2024-03-20T09:30:00Z' },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '858828', display: 'Lisinopril 10 MG Oral Tablet' }], text: 'Lisinopril 10mg' },
    subject: { reference: 'Patient/demo-pat-1', display: 'John Smith' },
    encounter: { reference: 'Encounter/demo-enc-1' },
    authoredOn: '2024-03-20T09:30:00Z',
    requester: { reference: 'Practitioner/demo-prac-1', display: 'Dr. Wilson' },
    dosageInstruction: [{ text: 'Take 1 tablet by mouth once daily', timing: { repeat: { frequency: 1, period: 1, periodUnit: 'd' } }, route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] } }],
  },
  {
    resourceType: 'MedicationRequest',
    id: 'demo-med-2',
    meta: { versionId: '1', lastUpdated: '2024-04-12T14:00:00Z' },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'Metformin 500 MG Oral Tablet' }], text: 'Metformin 500mg' },
    subject: { reference: 'Patient/demo-pat-3', display: 'Robert Williams' },
    authoredOn: '2024-04-12T14:00:00Z',
    requester: { reference: 'Practitioner/demo-prac-1', display: 'Dr. Wilson' },
    dosageInstruction: [{ text: 'Take 1 tablet by mouth twice daily with meals', timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } }, route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] } }],
    dispenseRequest: { validityPeriod: { start: '2024-04-12', end: '2025-04-12' }, numberOfRepeatsAllowed: 11, quantity: { value: 60, unit: 'Tablet' } },
  },
  {
    resourceType: 'MedicationRequest',
    id: 'demo-med-3',
    meta: { versionId: '1', lastUpdated: '2024-02-28T11:30:00Z' },
    status: 'completed',
    intent: 'order',
    medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '1191', display: 'Amoxicillin 500 MG Oral Capsule' }], text: 'Amoxicillin 500mg' },
    subject: { reference: 'Patient/demo-pat-2', display: 'Emily Johnson' },
    encounter: { reference: 'Encounter/demo-enc-2' },
    authoredOn: '2024-01-22T14:30:00Z',
    dosageInstruction: [{ text: 'Take 1 capsule by mouth three times daily for 10 days', timing: { repeat: { frequency: 3, period: 1, periodUnit: 'd' } }, route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] } }],
  },
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function matchesSearch(resource: FhirResource, params: Record<string, string | string[] | undefined>): boolean {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    const v = Array.isArray(value) ? value[0] : value;
    const lowerVal = v.toLowerCase();

    if (key === '_id') {
      if (resource.id !== v) return false;
      continue;
    }

    if (key === 'name' || key === 'family') {
      const names = resource.name as { family?: string; given?: string[]; text?: string }[] | undefined;
      const match = names?.some((n) => {
        const full = `${(n.given || []).join(' ')} ${n.family || ''} ${n.text || ''}`.toLowerCase();
        return full.includes(lowerVal);
      });
      if (!match) return false;
      continue;
    }

    if (key === 'gender') {
      if ((resource.gender as string)?.toLowerCase() !== lowerVal) return false;
      continue;
    }

    if (key === 'birthdate') {
      if (resource.birthDate !== v) return false;
      continue;
    }

    if (key === 'identifier') {
      const ids = resource.identifier as { value?: string; system?: string }[] | undefined;
      const match = ids?.some((i) => i.value?.toLowerCase().includes(lowerVal) || i.system?.toLowerCase().includes(lowerVal));
      if (!match) return false;
      continue;
    }

    if (key === 'patient') {
      const subject = resource.subject as { reference?: string } | undefined;
      const ref = subject?.reference || '';
      if (!ref.includes(v) && !ref.endsWith(`/${v}`)) return false;
      continue;
    }

    if (key === 'status') {
      if ((resource.status as string)?.toLowerCase() !== lowerVal) return false;
      continue;
    }

    if (key === 'clinical-status') {
      const cs = resource.clinicalStatus as { coding?: { code?: string }[]; text?: string } | undefined;
      const match = cs?.coding?.some((c) => c.code?.toLowerCase() === lowerVal) || cs?.text?.toLowerCase().includes(lowerVal);
      if (!match) return false;
      continue;
    }

    if (key === 'intent') {
      if ((resource.intent as string)?.toLowerCase() !== lowerVal) return false;
      continue;
    }

    if (key === 'category') {
      const cats = resource.category as { coding?: { code?: string; display?: string }[]; text?: string }[] | undefined;
      const match = cats?.some((c) => c.coding?.some((cod) => cod.code?.toLowerCase() === lowerVal || cod.display?.toLowerCase().includes(lowerVal)) || c.text?.toLowerCase().includes(lowerVal));
      if (!match) return false;
      continue;
    }

    if (key === 'code') {
      const code = resource.code as { coding?: { code?: string; display?: string }[]; text?: string } | undefined;
      const medCode = resource.medicationCodeableConcept as { coding?: { code?: string; display?: string }[]; text?: string } | undefined;
      const cc = code || medCode;
      const match = cc?.coding?.some((c) => c.code?.toLowerCase() === lowerVal || c.display?.toLowerCase().includes(lowerVal)) || cc?.text?.toLowerCase().includes(lowerVal);
      if (!match) return false;
      continue;
    }

    if (key === 'class') {
      const cls = resource.class as { code?: string; display?: string } | undefined;
      if (cls?.code?.toLowerCase() !== lowerVal && !cls?.display?.toLowerCase().includes(lowerVal)) return false;
      continue;
    }

    if (key === 'date') {
      const eff = resource.effectiveDateTime as string | undefined;
      const period = resource.period as { start?: string; end?: string } | undefined;
      const onset = resource.onsetDateTime as string | undefined;
      const authored = resource.authoredOn as string | undefined;
      const dateStr = eff || period?.start || onset || authored;
      if (dateStr && !dateStr.startsWith(v)) return false;
      continue;
    }

    // Fallback: check if resource has this key as a string property
    const val = resource[key];
    if (typeof val === 'string') {
      if (!val.toLowerCase().includes(lowerVal)) return false;
    }
  }
  return true;
}

export class DemoFhirClient {
  private resources: FhirResource[];
  private baseUrl: string;

  constructor(config: FhirClientConfig) {
    this.baseUrl = config.baseUrl;
    this.resources = deepClone(DEMO_RESOURCES);
  }

  get base(): string {
    return this.baseUrl;
  }

  setToken(_token: string | undefined) {
    // no-op for demo
  }

  async capabilityStatement(): Promise<FhirCapabilityStatement> {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: '2024-01-01',
      kind: 'instance',
      fhirVersion: '4.0.1',
      software: { name: 'FHIR Studio Demo Server', version: '1.0' },
      implementation: { description: 'Built-in demo FHIR R4 server', url: this.baseUrl },
      rest: [
        {
          mode: 'server',
          resource: ['Patient', 'Observation', 'Condition', 'Encounter', 'MedicationRequest'].map((type) => ({
            type,
            interaction: [{ code: 'read' }, { code: 'search-type' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }],
          })),
        },
      ],
    };
  }

  async read(resourceType: FhirResourceType, id: string): Promise<FhirResource> {
    const r = this.resources.find((res) => res.resourceType === resourceType && res.id === id);
    if (!r) throw new FhirError(`${resourceType}/${id} not found`, 404, null);
    return deepClone(r);
  }

  async search(
    resourceType: FhirResourceType,
    params: Record<string, string | string[] | undefined>,
    _pageUrl?: string,
  ): Promise<SearchResult> {
    await new Promise((resolve) => setTimeout(resolve, 300)); // simulate latency
    const filtered = this.resources.filter((r) => {
      if (r.resourceType !== resourceType) return false;
      return matchesSearch(r, params);
    });
    const entries = filtered.map((r) => ({ fullUrl: `${this.baseUrl}/${r.resourceType}/${r.id}`, resource: deepClone(r) }));
    const bundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: filtered.length,
      entry: entries,
    };
    return { bundle, resources: entries.map((e) => e.resource!).filter(Boolean), total: filtered.length, links: {} };
  }

  async create(resource: FhirResource): Promise<FhirResource> {
    const newId = `demo-${resource.resourceType.toLowerCase()}-${Date.now()}`;
    const created = { ...deepClone(resource), id: newId, meta: { versionId: '1', lastUpdated: new Date().toISOString() } };
    this.resources.push(created);
    return deepClone(created);
  }

  async update(resource: FhirResource): Promise<FhirResource> {
    if (!resource.id) throw new Error('Cannot update a resource without an id.');
    const idx = this.resources.findIndex((r) => r.resourceType === resource.resourceType && r.id === resource.id);
    if (idx === -1) throw new FhirError(`${resource.resourceType}/${resource.id} not found`, 404, null);
    const updated = { ...deepClone(resource), meta: { versionId: String(parseInt(this.resources[idx].meta?.versionId || '1') + 1), lastUpdated: new Date().toISOString() } };
    this.resources[idx] = updated;
    return deepClone(updated);
  }

  async validate(resource: FhirResource): Promise<FhirOperationOutcome> {
    await new Promise((resolve) => setTimeout(resolve, 400)); // simulate validation latency
    const issues: { severity: 'error' | 'warning' | 'information'; code: 'required' | 'value' | 'informational'; diagnostics?: string; expression?: string[] }[] = [];

    // Basic required field checks
    if (resource.resourceType === 'Observation' && !resource.code) {
      issues.push({ severity: 'error', code: 'required', diagnostics: 'Observation.code is required (min cardinality 1).', expression: ['Observation.code'] });
    }
    if (resource.resourceType === 'Condition' && !resource.subject) {
      issues.push({ severity: 'error', code: 'required', diagnostics: 'Condition.subject is required (min cardinality 1).', expression: ['Condition.subject'] });
    }
    if (resource.resourceType === 'MedicationRequest' && !resource.subject) {
      issues.push({ severity: 'error', code: 'required', diagnostics: 'MedicationRequest.subject is required (min cardinality 1).', expression: ['MedicationRequest.subject'] });
    }
    if (resource.resourceType === 'MedicationRequest' && !resource.intent) {
      issues.push({ severity: 'error', code: 'required', diagnostics: 'MedicationRequest.intent is required (min cardinality 1).', expression: ['MedicationRequest.intent'] });
    }

    if (resource.resourceType === 'Patient' && resource.name) {
      const name = (resource.name as { family?: string }[])[0];
      if (!name?.family) {
        issues.push({ severity: 'warning', code: 'value', diagnostics: 'Patient name should include a family name.', expression: ['Patient.name[0].family'] });
      }
    }

    if (issues.length === 0) {
      return {
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'information', code: 'informational', diagnostics: 'All validations passed.' }],
      };
    }

    return { resourceType: 'OperationOutcome', issue: issues };
  }

  async delete(resourceType: FhirResourceType, id: string): Promise<void> {
    const idx = this.resources.findIndex((r) => r.resourceType === resourceType && r.id === id);
    if (idx === -1) throw new FhirError(`${resourceType}/${id} not found`, 404, null);
    this.resources.splice(idx, 1);
  }

  async fetchWellKnownSmart(): Promise<unknown> {
    throw new FhirError('SMART configuration not available in demo mode.', 404, null);
  }
}
