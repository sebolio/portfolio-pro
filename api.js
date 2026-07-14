/* =========================================
   STATIC API SERVICE
   Reads from local static JSON files in /api/
   ========================================= */

const API_BASE = './api';
const cache = new Map();

async function fetchJSON(file) {
  if (cache.has(file)) {
    return cache.get(file);
  }

  const promise = (async () => {
    const res = await fetch(`${API_BASE}/${file}.json`);
    if (!res.ok) throw new Error(`Failed to load ${file}.json (${res.status})`);
    return res.json();
  })();

  cache.set(file, promise);

  try {
    return await promise;
  } catch (error) {
    cache.delete(file);
    throw error;
  }
}

function unwrapSingle(response) {
  return response?.data ?? null;
}

function unwrapList(response) {
  return {
    data: response?.data ?? [],
    pagination: response?.meta?.pagination ?? null,
  };
}

function findByIdOrSlug(items, identifier) {
  if (!Array.isArray(items)) return null;
  if (identifier === undefined || identifier === null) return items[0] ?? null;

  const target = String(identifier);

  return (
    items.find((item) => {
      const candidates = [
        item?.documentId,
        item?.slug,
        item?.attributes?.id,
        item?.attributes?.slug,
        item?.data?.id,
        item?.data?.slug,
        item?.data?.attributes?.id,
        item?.data?.attributes?.slug,
      ];

      return candidates.some((value) => String(value) === target);
    }) ?? null
  );
}

export async function getWelcome() {
  return unwrapSingle(await fetchJSON('welcome'));
}

export async function getWelcomeSingle() {
  return getWelcome();
}

export async function getAbout() {
  return unwrapSingle(await fetchJSON('about'));
}

export async function getAboutSingle() {
  return getAbout();
}

export async function getProjects() {
  return unwrapList(await fetchJSON('projects'));
}

export async function getProject(id) {
  return findByIdOrSlug((await getProjects()).data, id);
}

export async function getProjectSingle(id) {
  return getProject(id);
}

export async function getClients() {
  return unwrapList(await fetchJSON('clients'));
}

export async function getClient(id) {
  return findByIdOrSlug((await getClients()).data, id);
}

export async function getClientSingle(id) {
  return getClient(id);
}

export async function getServices() {
  return unwrapList(await fetchJSON('services'));
}

export async function getService(id) {
  return findByIdOrSlug((await getServices()).data, id);
}

export async function getServiceSingle(id) {
  return getService(id);
}

export async function getTechnologies() {
  return unwrapList(await fetchJSON('technologies'));
}

export async function getTechnology(id) {
  return findByIdOrSlug((await getTechnologies()).data, id);
}

export async function getTechnologySingle(id) {
  return getTechnology(id);
}

export async function getIndustries() {
  return unwrapList(await fetchJSON('industries'));
}

export async function getIndustry(id) {
  return findByIdOrSlug((await getIndustries()).data, id);
}

export async function getIndustrySingle(id) {
  return getIndustry(id);
}

export async function getClientSizes() {
  return unwrapList(await fetchJSON('client-sizes'));
}

export async function getClientSize(id) {
  return findByIdOrSlug((await getClientSizes()).data, id);
}

export async function getClientSizeSingle(id) {
  return getClientSize(id);
}

export async function getProjectTypes() {
  return unwrapList(await fetchJSON('project-types'));
}

export async function getProjectType(id) {
  return findByIdOrSlug((await getProjectTypes()).data, id);
}

export async function getProjectTypeSingle(id) {
  return getProjectType(id);
}

export async function getPosts() {
  return unwrapList(await fetchJSON('posts'));
}

export async function getPost(id) {
  return findByIdOrSlug((await getPosts()).data, id);
}

export async function getPostSingle(id) {
  return getPost(id);
}

export async function getTags() {
  return unwrapList(await fetchJSON('tags'));
}

export async function getTag(id) {
  return findByIdOrSlug((await getTags()).data, id);
}

export async function getTagSingle(id) {
  return getTag(id);
}
