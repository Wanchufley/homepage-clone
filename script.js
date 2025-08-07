async function loadYAML(url) {
  const response = await fetch(url);
  const text = await response.text();
  return jsyaml.load(text);
}
async function checkServiceStatus(service, cardElement) {
  if (!service.statusCheck) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(service.statusCheck, { signal: controller.signal });
    clearTimeout(timeoutId);

    const isOnline = response.ok;

    const color = isOnline ? 'green' : 'red';
    const dotHTML = `
      <span class="absolute top-2 right-2 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-${color}-500"></span>
      </span>
    `;

    cardElement.insertAdjacentHTML('beforeend', dotHTML);

  } catch (error) {
    const dotHTML = `
      <span class="absolute top-2 right-2 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    `;
    cardElement.insertAdjacentHTML('beforeend', dotHTML);
  }
}
function createCard(service) {
  const ext = service.icon.endsWith('.svg') ? 'svg' : 'png';
  const iconUrl = `https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/${ext}/${service.icon}`;

  const id = `service-${Math.random().toString(36).substr(2, 9)}`;


  return `
    <a id="${id}" href="${service.url}" target="_blank"
       class="relative bg-gray-700 hover:bg-gray-500 transition rounded-md p-2 shadow-lg flex flex-col">
      <span class="absolute top-2 left-2 bg-gray-600 bg-opacity-80 text-white text-xs font-semibold px-2 py-1 rounded-md">
        ${service.name}
      </span>
      <img src="${iconUrl}" alt="${service.name}" class="w-12 h-12 mt-8" />
    </a>
  `;
}

async function renderDashboard(data) {
  const container = document.getElementById('dashboard');
  const layout = data.layout?.trim() || 'rows';
  const services = data.services;

  // Group services by category
  const categories = {};
  services.forEach(service => {
    const category = service.category?.trim() || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(service);
  });

  // Set layout class for the whole page (categories container)
  const layoutClass = layout === 'columns'
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'
    : 'flex flex-col gap-2';

  // Create container element for all category blocks
  const layoutContainer = document.createElement('div');
  layoutContainer.className = layoutClass;

  // Create category blocks
  for (const [category, items] of Object.entries(categories)) {
    const section = document.createElement('section');
    section.className = 'gap-2';

    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'text-2xl font-bold mb-2';
    categoryTitle.textContent = category;

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'flex flex-col gap-2';

    for (const service of items) {
      const cardHTML = createCard(service);
      const cardWrapper = document.createElement('div');
      cardWrapper.innerHTML = cardHTML;
      const cardElement = cardWrapper.firstElementChild;

      await checkServiceStatus(service, cardElement);

      itemsContainer.appendChild(cardElement);
    }

    section.appendChild(categoryTitle);
    section.appendChild(itemsContainer);
    layoutContainer.appendChild(section);
  }

  container.appendChild(layoutContainer);
}

loadYAML('data.yaml').then(data => {
  renderDashboard(data);
});

