import type { FhirResource } from './types';

export interface SearchParamDef {
  name: string;
  label: string;
  type: 'string' | 'date' | 'token' | 'reference' | 'quantity';
  placeholder?: string;
}

export interface FormFieldDef {
  path: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'datetime' | 'select' | 'number' | 'reference';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
}

export interface ResourceMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
  searchParams: SearchParamDef[];
  formFields: FormFieldDef[];
  columns: { key: string; label: string; render: (r: FhirResource) => string }[];
  renderSummary: (r: FhirResource) => { label: string; value: string }[];
}

function safe<T>(v: T | undefined, fallback = '--'): string {
  return v === undefined || v === null || v === '' ? fallback : String(v);
}

function formatDate(d?: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function formatDateTime(d?: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

function codingDisplay(coding: { display?: string; code?: string }[] | undefined): string {
  if (!coding || coding.length === 0) return '--';
  return coding[0]?.display || coding[0]?.code || '--';
}

function codeableDisplay(cc: { coding?: { display?: string; code?: string }[]; text?: string } | undefined): string {
  if (!cc) return '--';
  return cc.text || codingDisplay(cc.coding);
}

function patientName(r: FhirResource): string {
  const names = r.name as { family?: string; given?: string[]; text?: string }[] | undefined;
  if (!names || names.length === 0) return 'Unknown';
  const n = names[0];
  if (n.text) return n.text;
  return [n.given?.join(' '), n.family].filter(Boolean).join(' ').trim() || 'Unknown';
}

function patientAge(r: FhirResource): string {
  const bd = r.birthDate as string | undefined;
  if (!bd) return '--';
  const birth = new Date(bd);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age}y`;
}

export const RESOURCE_METADATA: Record<string, ResourceMetadata> = {
  Patient: {
    type: 'Patient',
    label: 'Patients',
    icon: 'Users',
    description: 'Demographics and administrative data about a person receiving care.',
    searchParams: [
      { name: 'name', label: 'Name', type: 'string', placeholder: 'e.g. smith' },
      { name: 'birthdate', label: 'Birth Date', type: 'date' },
      { name: 'gender', label: 'Gender', type: 'token', placeholder: 'male, female, other' },
      { name: 'identifier', label: 'Identifier', type: 'token', placeholder: 'MRN' },
      { name: 'family', label: 'Family Name', type: 'string', placeholder: 'last name' },
      { name: '_id', label: 'ID', type: 'string', placeholder: 'resource id' },
    ],
    formFields: [
      { path: 'name[0].family', label: 'Family Name', type: 'text', required: true },
      { path: 'name[0].given[0]', label: 'Given Name', type: 'text', required: true },
      { path: 'gender', label: 'Gender', type: 'select', options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'unknown', label: 'Unknown' },
      ] },
      { path: 'birthDate', label: 'Birth Date', type: 'date' },
      { path: 'telecom[0].system', label: 'Contact System', type: 'select', options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
        { value: 'url', label: 'URL' },
      ] },
      { path: 'telecom[0].value', label: 'Contact Value', type: 'text', placeholder: 'e.g. 555-0100' },
      { path: 'telecom[0].use', label: 'Contact Use', type: 'select', options: [
        { value: 'home', label: 'Home' },
        { value: 'work', label: 'Work' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'temp', label: 'Temp' },
      ] },
      { path: 'address[0].line[0]', label: 'Address Line', type: 'text' },
      { path: 'address[0].city', label: 'City', type: 'text' },
      { path: 'address[0].state', label: 'State', type: 'text' },
      { path: 'address[0].postalCode', label: 'Postal Code', type: 'text' },
      { path: 'address[0].country', label: 'Country', type: 'text' },
    ],
    columns: [
      { key: 'name', label: 'Name', render: (r) => patientName(r) },
      { key: 'id', label: 'ID', render: (r) => safe(r.id) },
      { key: 'gender', label: 'Gender', render: (r) => safe(r.gender as string) },
      { key: 'birthDate', label: 'DOB', render: (r) => formatDate(r.birthDate as string) },
      { key: 'age', label: 'Age', render: (r) => patientAge(r) },
    ],
    renderSummary: (r) => [
      { label: 'Full Name', value: patientName(r) },
      { label: 'ID', value: safe(r.id) },
      { label: 'Gender', value: safe(r.gender as string) },
      { label: 'Date of Birth', value: formatDate(r.birthDate as string) },
      { label: 'Age', value: patientAge(r) },
      { label: 'Active', value: r.active !== undefined ? (r.active ? 'Yes' : 'No') : '--' },
      { label: 'Deceased', value: r.deceasedBoolean ? 'Yes' : 'No' },
    ],
  },
  Observation: {
    type: 'Observation',
    label: 'Observations',
    icon: 'Activity',
    description: 'Measurements and assessments about a patient.',
    searchParams: [
      { name: 'patient', label: 'Patient ID', type: 'reference', placeholder: 'patient id' },
      { name: 'category', label: 'Category', type: 'token', placeholder: 'vital-signs, laboratory' },
      { name: 'code', label: 'Code', type: 'token', placeholder: 'loinc code' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'token', placeholder: 'final, preliminary' },
      { name: '_id', label: 'ID', type: 'string', placeholder: 'resource id' },
    ],
    formFields: [
      { path: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'registered', label: 'Registered' },
        { value: 'preliminary', label: 'Preliminary' },
        { value: 'final', label: 'Final' },
        { value: 'amended', label: 'Amended' },
        { value: 'corrected', label: 'Corrected' },
        { value: 'entered-in-error', label: 'Entered in Error' },
        { value: 'unknown', label: 'Unknown' },
      ] },
      { path: 'code.coding[0].system', label: 'Code System', type: 'text', required: true, placeholder: 'e.g. http://loinc.org' },
      { path: 'code.coding[0].code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. 8867-4' },
      { path: 'code.coding[0].display', label: 'Display', type: 'text', placeholder: 'e.g. Heart rate' },
      { path: 'code.text', label: 'Code Text', type: 'text' },
      { path: 'subject.reference', label: 'Subject Reference', type: 'reference', required: true, placeholder: 'Patient/123' },
      { path: 'effectiveDateTime', label: 'Effective Date', type: 'datetime' },
      { path: 'valueQuantity.value', label: 'Value', type: 'number' },
      { path: 'valueQuantity.unit', label: 'Unit', type: 'text', placeholder: 'e.g. bpm' },
      { path: 'valueQuantity.code', label: 'Unit Code', type: 'text', placeholder: 'UCUM code' },
    ],
    columns: [
      { key: 'code', label: 'Observation', render: (r) => codeableDisplay(r.code as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { key: 'status', label: 'Status', render: (r) => safe(r.status as string) },
      { key: 'value', label: 'Value', render: (r) => {
        const vq = r.valueQuantity as { value?: number; unit?: string } | undefined;
        const vs = r.valueString as string | undefined;
        if (vq?.value !== undefined) return `${vq.value}${vq.unit ? ' ' + vq.unit : ''}`;
        if (vs !== undefined) return String(vs);
        return '--';
      } },
      { key: 'date', label: 'Date', render: (r) => formatDateTime(r.effectiveDateTime as string) },
      { key: 'id', label: 'ID', render: (r) => safe(r.id) },
    ],
    renderSummary: (r) => [
      { label: 'Observation', value: codeableDisplay(r.code as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { label: 'Status', value: safe(r.status as string) },
      { label: 'Category', value: safe((r.category as { coding?: { display?: string }[] }[] | undefined)?.[0]?.coding?.[0]?.display) },
      { label: 'Effective Date', value: formatDateTime(r.effectiveDateTime as string) },
      { label: 'Value', value: (() => {
        const vq = r.valueQuantity as { value?: number; unit?: string } | undefined;
        const vs = r.valueString as string | undefined;
        if (vq?.value !== undefined) return `${vq.value}${vq.unit ? ' ' + vq.unit : ''}`;
        if (vs !== undefined) return String(vs);
        return '--';
      })() },
      { label: 'Subject', value: safe((r.subject as { display?: string; reference?: string })?.display || (r.subject as { reference?: string })?.reference) },
    ],
  },
  Condition: {
    type: 'Condition',
    label: 'Conditions',
    icon: 'Stethoscope',
    description: 'Clinical conditions, problems, or diagnoses.',
    searchParams: [
      { name: 'patient', label: 'Patient ID', type: 'reference', placeholder: 'patient id' },
      { name: 'code', label: 'Code', type: 'token', placeholder: 'snomed code' },
      { name: 'clinical-status', label: 'Clinical Status', type: 'token', placeholder: 'active, resolved' },
      { name: '_id', label: 'ID', type: 'string', placeholder: 'resource id' },
    ],
    formFields: [
      { path: 'clinicalStatus.coding[0].code', label: 'Clinical Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'recurrence', label: 'Recurrence' },
        { value: 'relapse', label: 'Relapse' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'remission', label: 'Remission' },
        { value: 'resolved', label: 'Resolved' },
      ] },
      { path: 'clinicalStatus.coding[0].system', label: 'Status System', type: 'text', placeholder: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
      { path: 'code.coding[0].system', label: 'Code System', type: 'text', required: true, placeholder: 'http://snomed.info/sct' },
      { path: 'code.coding[0].code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. 38341003' },
      { path: 'code.coding[0].display', label: 'Display', type: 'text', placeholder: 'e.g. Hypertension' },
      { path: 'code.text', label: 'Code Text', type: 'text' },
      { path: 'subject.reference', label: 'Subject Reference', type: 'reference', required: true, placeholder: 'Patient/123' },
      { path: 'onsetDateTime', label: 'Onset Date', type: 'datetime' },
      { path: 'recordedDate', label: 'Recorded Date', type: 'datetime' },
    ],
    columns: [
      { key: 'code', label: 'Condition', render: (r) => codeableDisplay(r.code as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { key: 'status', label: 'Clinical Status', render: (r) => codeableDisplay(r.clinicalStatus as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { key: 'onset', label: 'Onset', render: (r) => formatDate(r.onsetDateTime as string) },
      { key: 'recorded', label: 'Recorded', render: (r) => formatDate(r.recordedDate as string) },
      { key: 'id', label: 'ID', render: (r) => safe(r.id) },
    ],
    renderSummary: (r) => [
      { label: 'Condition', value: codeableDisplay(r.code as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { label: 'Clinical Status', value: codeableDisplay(r.clinicalStatus as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { label: 'Verification', value: codeableDisplay(r.verificationStatus as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { label: 'Onset Date', value: formatDateTime(r.onsetDateTime as string) },
      { label: 'Recorded Date', value: formatDate(r.recordedDate as string) },
      { label: 'Subject', value: safe((r.subject as { display?: string; reference?: string })?.display || (r.subject as { reference?: string })?.reference) },
    ],
  },
  Encounter: {
    type: 'Encounter',
    label: 'Encounters',
    icon: 'ClipboardList',
    description: 'Interactions between a patient and healthcare provider.',
    searchParams: [
      { name: 'patient', label: 'Patient ID', type: 'reference', placeholder: 'patient id' },
      { name: 'status', label: 'Status', type: 'token', placeholder: 'finished, in-progress' },
      { name: 'class', label: 'Class', type: 'token', placeholder: 'ambulatory, emergency' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: '_id', label: 'ID', type: 'string', placeholder: 'resource id' },
    ],
    formFields: [
      { path: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'planned', label: 'Planned' },
        { value: 'arrived', label: 'Arrived' },
        { value: 'triaged', label: 'Triaged' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'onleave', label: 'On Leave' },
        { value: 'finished', label: 'Finished' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'entered-in-error', label: 'Entered in Error' },
        { value: 'unknown', label: 'Unknown' },
      ] },
      { path: 'class.code', label: 'Class Code', type: 'text', required: true, placeholder: 'e.g. AMB' },
      { path: 'class.system', label: 'Class System', type: 'text', placeholder: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' },
      { path: 'class.display', label: 'Class Display', type: 'text', placeholder: 'e.g. ambulatory' },
      { path: 'subject.reference', label: 'Subject Reference', type: 'reference', required: true, placeholder: 'Patient/123' },
      { path: 'period.start', label: 'Period Start', type: 'datetime' },
      { path: 'period.end', label: 'Period End', type: 'datetime' },
    ],
    columns: [
      { key: 'class', label: 'Class', render: (r) => safe((r.class as { display?: string; code?: string })?.display || (r.class as { code?: string })?.code) },
      { key: 'status', label: 'Status', render: (r) => safe(r.status as string) },
      { key: 'start', label: 'Start', render: (r) => formatDateTime((r.period as { start?: string })?.start) },
      { key: 'end', label: 'End', render: (r) => formatDateTime((r.period as { end?: string })?.end) },
      { key: 'id', label: 'ID', render: (r) => safe(r.id) },
    ],
    renderSummary: (r) => [
      { label: 'Status', value: safe(r.status as string) },
      { label: 'Class', value: safe((r.class as { display?: string; code?: string })?.display || (r.class as { code?: string })?.code) },
      { label: 'Start', value: formatDateTime((r.period as { start?: string })?.start) },
      { label: 'End', value: formatDateTime((r.period as { end?: string })?.end) },
      { label: 'Subject', value: safe((r.subject as { display?: string; reference?: string })?.display || (r.subject as { reference?: string })?.reference) },
      { label: 'Type', value: codeableDisplay((r.type as { coding?: { display?: string; code?: string }[]; text?: string }[] | undefined)?.[0]) },
    ],
  },
  MedicationRequest: {
    type: 'MedicationRequest',
    label: 'Medication Requests',
    icon: 'Pill',
    description: 'Orders/requests for medications for a patient.',
    searchParams: [
      { name: 'patient', label: 'Patient ID', type: 'reference', placeholder: 'patient id' },
      { name: 'status', label: 'Status', type: 'token', placeholder: 'active, completed' },
      { name: 'intent', label: 'Intent', type: 'token', placeholder: 'order, plan' },
      { name: 'code', label: 'Medication Code', type: 'token', placeholder: 'rxnorm code' },
      { name: '_id', label: 'ID', type: 'string', placeholder: 'resource id' },
    ],
    formFields: [
      { path: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'completed', label: 'Completed' },
        { value: 'entered-in-error', label: 'Entered in Error' },
        { value: 'stopped', label: 'Stopped' },
        { value: 'draft', label: 'Draft' },
        { value: 'unknown', label: 'Unknown' },
      ] },
      { path: 'intent', label: 'Intent', type: 'select', required: true, options: [
        { value: 'proposal', label: 'Proposal' },
        { value: 'plan', label: 'Plan' },
        { value: 'order', label: 'Order' },
        { value: 'original-order', label: 'Original Order' },
        { value: 'reflex-order', label: 'Reflex Order' },
        { value: 'filler-order', label: 'Filler Order' },
        { value: 'instance-order', label: 'Instance Order' },
        { value: 'option', label: 'Option' },
      ] },
      { path: 'medicationCodeableConcept.coding[0].system', label: 'Code System', type: 'text', placeholder: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
      { path: 'medicationCodeableConcept.coding[0].code', label: 'Code', type: 'text', placeholder: 'e.g. 1049502' },
      { path: 'medicationCodeableConcept.coding[0].display', label: 'Display', type: 'text', placeholder: 'e.g. Oxycodone' },
      { path: 'medicationCodeableConcept.text', label: 'Medication Text', type: 'text' },
      { path: 'subject.reference', label: 'Subject Reference', type: 'reference', required: true, placeholder: 'Patient/123' },
      { path: 'authoredOn', label: 'Authored On', type: 'datetime' },
      { path: 'dosageInstruction[0].text', label: 'Dosage Text', type: 'textarea', placeholder: 'e.g. 1 tablet every 8 hours' },
    ],
    columns: [
      { key: 'medication', label: 'Medication', render: (r) => codeableDisplay(r.medicationCodeableConcept as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { key: 'status', label: 'Status', render: (r) => safe(r.status as string) },
      { key: 'intent', label: 'Intent', render: (r) => safe(r.intent as string) },
      { key: 'authored', label: 'Authored', render: (r) => formatDate(r.authoredOn as string) },
      { key: 'id', label: 'ID', render: (r) => safe(r.id) },
    ],
    renderSummary: (r) => [
      { label: 'Medication', value: codeableDisplay(r.medicationCodeableConcept as { coding?: { display?: string; code?: string }[]; text?: string }) },
      { label: 'Status', value: safe(r.status as string) },
      { label: 'Intent', value: safe(r.intent as string) },
      { label: 'Authored On', value: formatDateTime(r.authoredOn as string) },
      { label: 'Subject', value: safe((r.subject as { display?: string; reference?: string })?.display || (r.subject as { reference?: string })?.reference) },
      { label: 'Dosage', value: safe((r.dosageInstruction as { text?: string }[] | undefined)?.[0]?.text) },
    ],
  },
};

export const RESOURCE_TYPES = Object.keys(RESOURCE_METADATA) as Array<keyof typeof RESOURCE_METADATA>;

export const DEFAULT_FHIR_SERVERS = [
  { label: 'SMART Health IT (Sandbox)', url: 'https://sandbox.smarthealthit.org/smart/api/fhir/' },
  { label: 'FHIR Public Test Server (R4)', url: 'http://hapi.fhir.org/baseR4' },
  { label: 'Vonk / Firely', url: 'https://vonk.fire.ly/r4' },
];
