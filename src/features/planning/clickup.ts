const CLICKUP_API_BASE_URL = "https://api.clickup.com/api/v2";
const CONTENT_UPLOAD_CALENDAR_LIST_ID = "240082332";

type ClickUpCustomField = {
  id: string;
  name: string;
  type: string;
  type_config?: {
    options?: Array<{
      id: string;
      name?: string;
      label?: string;
    }>;
  };
};

type ClickUpTaskResponse = {
  id: string;
  url?: string;
};

type ClickUpCustomFieldValue = {
  id: string;
  value: string | number;
};

type RoadmapClickUpPayload = {
  title: string;
  provider: string | null;
  releaseDate: string | null;
};

export async function createContentUploadTask(payload: RoadmapClickUpPayload) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    throw new Error("Add CLICKUP_API_TOKEN to enable ClickUp pushes.");
  }

  const listId = process.env.CLICKUP_CONTENT_UPLOAD_LIST_ID ?? CONTENT_UPLOAD_CALENDAR_LIST_ID;
  const fields = await getCustomFields({ token, listId });
  const customFields = buildCustomFields(fields, payload);

  const response = await clickUpFetch<ClickUpTaskResponse>({
    token,
    path: `/list/${listId}/task`,
    init: {
      method: "POST",
      body: JSON.stringify({
        name: payload.title,
        status: "new submission",
        markdown_content: buildDescription(payload),
        custom_fields: customFields,
        check_required_custom_fields: false
      })
    }
  });

  return {
    taskId: response.id,
    taskUrl: response.url ?? `https://app.clickup.com/t/${response.id}`
  };
}

async function getCustomFields({ token, listId }: { token: string; listId: string }) {
  const response = await clickUpFetch<{ fields?: ClickUpCustomField[] }>({
    token,
    path: `/list/${listId}/field`
  });

  return response.fields ?? [];
}

async function clickUpFetch<T>({ token, path, init }: { token: string; path: string; init?: RequestInit }) {
  const response = await fetch(`${CLICKUP_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`ClickUp request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function buildCustomFields(fields: ClickUpCustomField[], payload: RoadmapClickUpPayload): ClickUpCustomFieldValue[] {
  return [
    buildDateField(fields, ["Publish Date"], payload.releaseDate),
    buildTextField(fields, ["Provider"], payload.provider)
  ].filter((field): field is ClickUpCustomFieldValue => Boolean(field));
}

function buildDateField(fields: ClickUpCustomField[], names: string[], value: string | null): ClickUpCustomFieldValue | null {
  if (!value || !isExactDate(value)) return null;
  const field = findField(fields, names);
  if (!field) return null;

  return {
    id: field.id,
    value: new Date(`${value}T00:00:00.000Z`).getTime()
  };
}

function buildTextField(fields: ClickUpCustomField[], names: string[], value: string | null): ClickUpCustomFieldValue | null {
  if (!value) return null;
  const field = findField(fields, names);
  if (!field) return null;

  return {
    id: field.id,
    value
  };
}

function findField(fields: ClickUpCustomField[], names: string[]) {
  const normalizedNames = names.map(normalizeName);
  return fields.find((field) => normalizedNames.includes(normalizeName(field.name)));
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function isExactDate(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

function buildDescription(payload: RoadmapClickUpPayload) {
  return [
    `Created from the internal licensing roadmap.`,
    "",
    `Provider: ${payload.provider ?? "Not set"}`,
    `Publish Date: ${payload.releaseDate && isExactDate(payload.releaseDate) ? payload.releaseDate : "Not set"}`
  ].join("\n");
}
