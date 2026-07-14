import * as api from './api.js';
window.api = api;

/* =========================================
   1. CONFIGURACIÓN GLOBAL & UTILIDADES
   ========================================= */
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }

let currentLang = localStorage.getItem('site_lang') || 'es';
let isDarkMode = true;
let particleWorker = null;
let savedScrollPosition = 0;
let activeCardId = null;
let currentFilteredProjects = [];
let requireShiftForThemeToggle = false;

async function setupEventListeners() {

  // console.log(`About`, await api.getAbout());
  console.log(`Posts`, (await api.getPosts()).data);
  console.log(`Projects`, (await api.getProjects()).data);
  console.log(`Clients`, (await api.getClients()).data);

  const filters = ['industry-select', 'tech-select', 'type-select'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { renderProjects(); checkResetButton(); });
  });

  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', (e) => toggleTheme(e));

  const navToggle = document.getElementById('nav-toggle');
  if (navToggle) navToggle.addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('open'));

  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener('click', () => {
      const wrapper = document.getElementById('filter-content');
      wrapper.classList.toggle('open');
      const icon = mobileFilterToggle.querySelector('.toggle-icon');
      if (icon) icon.textContent = wrapper.classList.contains('open') ? '−' : '+';
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') document.body.classList.add('alt');
    if (e.key.toLowerCase() === 'd' && (!requireShiftForThemeToggle || e.shiftKey)) {
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
      e.preventDefault();
      toggleTheme(e);
    }
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Alt') document.body.classList.remove('alt'); });
  window.addEventListener('blur', () => document.body.classList.remove('alt'));
}

/* =========================================
   3. DATA PROJECTS
   ========================================= */
const dummyImages = [
  "img/dummy.png",
  "img/dummy1.png",
  "img/dummy2.png",
  "img/dummy3.png",
  "img/dummy4.png"
];

let projectsData = [
  {
    id: 1, year: 2025, title: "ENTi", type: "Emprendimiento Propio", industry: "Marketing / SaaS", images: dummyImages,
    desc: { es: "Sistema de reputación.", en: "Automated reputation and rating system." },
    about: { es: "ENTi es un sistema de valoraciones que permite filtrar las malas opiniones de tus clientes dejándolas en una plataforma privada, para que puedas contactar directamente a quienes hayan tenido experiencias poco satisfactorias y puedas solucionarlo sin que afecte tu reputación pública, mientras las buenas valoraciones quedan directamente en Google.", en: "ENTi is a rating system that allows filtering bad reviews to a private platform, letting you solve issues directly without affecting public reputation, while pushing good reviews to Google." },
    stack: ["SaaS", "AI", "Real-time"], role: "Creator", client: "SaaS"
  },
  {
    id: 2, year: 2025, title: "SAMO", type: "Arquitectura / Liderazgo", industry: "Fintech / ERP", images: dummyImages,
    desc: { es: "ERP modular de facturación.", en: "Modular billing and inventory ERP." },
    about: { es: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec aliquam purus, vel gravida leo. Proin semper lobortis nunc, eu laoreet felis tristique nec. Nulla facilisi. Sed mattis dapibus augue, id convallis urna mollis id. Fusce eget interdum lectus, vel luctus nulla. Etiam consectetur, urna eget ultricies semper, orci dui convallis lorem, vitae efficitur dolor ipsum ut odio. Donec imperdiet velit in efficitur malesuada. Nulla a ex eu leo posuere lacinia vitae nec diam. Etiam varius, lectus non ultricies pulvinar, odio mauris efficitur justo, vel hendrerit lacus leo in augue. Suspendisse lacinia mattis finibus. Aenean ultricies placerat sapien.", en: "SAMO helps manage billing and inventory from any device, generating all types of tax documents (DTE) and extensive reports." }, stack: ["Scalable Arch", "Cloud", "DTE"], role: "Architect", client: "Enterprise"
  },
  {
    id: 3, year: 2023, title: "AFEX+", type: "Arquitectura / Liderazgo", industry: "Fintech", images: dummyImages,
    desc: { es: "Framework financiero.", en: "Base framework for financial ecosystem." },
    about: { es: "Framework interno base sobre el cual se desarrolla cada proyecto actualmente en AFEX. Trabajo como Arquitecto de Software desde 2022, a cargo de tomar decisiones que afectan a 4 equipos de desarrollo.", en: "Internal framework on top of which every project is currently developed at AFEX. Working as Software Architect since 2022." },
    stack: ["Architecture", "Leadership"], role: "Architect", client: "AFEX"
  },
  {
    id: 4, year: 2023, title: "Dreamoms", type: "Consultoría", industry: "EdTech", images: dummyImages,
    desc: { es: "Plataforma LMS.", en: "LMS platform with streaming." },
    about: { es: "Plataforma de cursos online con streaming de video y clases en vivo, con un potente sistema de gestión para dueños, profesores y estudiantes.", en: "Online courses platform with video streaming and live classes, featuring a powerful management system for owners, teachers and students." },
    stack: ["Video", "LMS"], role: "Lead Dev", client: "Dreamoms"
  },
  {
    id: 5, year: 2023, title: "seb.cl", type: "Emprendimiento Propio", industry: "Open Source", images: dummyImages,
    desc: { es: "Portafolio personal.", en: "Open Source personal portfolio." },
    about: { es: "Mi portafolio personal construido en Vue 3, lanzado como código abierto para que cualquiera lo use.", en: "My portfolio built in Vue 3, released as open source for anyone to use." },
    stack: ["Vue 3", "Open Source"], role: "Creator", client: "Personal"
  },
  {
    id: 6, year: 2023, title: "COBROKIT", type: "Emprendimiento Propio", industry: "Fintech", images: dummyImages,
    desc: { es: "Suscripciones para devs.", en: "Subscription platform for devs." },
    about: { es: "COBROKIT es una plataforma para desarrolladores, que permite implementar suscripciones con diversos medios de pago en cualquier software o sistema SaaS en 5 minutos.", en: "COBROKIT is a developer platform that allows implementing subscriptions with various payment methods in any software or SaaS system in 5 minutes." },
    stack: ["Payments", "API", "SaaS"], role: "Solo Dev", client: "Devs"
  },
  {
    id: 7, year: 2021, title: "1n", type: "Consultoría", industry: "Marketing", images: dummyImages,
    desc: { es: "Plataforma ROI.", en: "Marketing platform (ROI Agency)." },
    about: { es: "Plataforma de marketing similar a ENTi, construida específicamente para la agencia ROI.", en: "Marketing platform similar to ENTi, built for the ROI Agency." },
    stack: ["Marketing", "Web"], role: "Dev", client: "ROI Agency"
  },
  {
    id: 8, year: 2021, title: "1n Website", type: "Consultoría", industry: "Web", images: dummyImages,
    desc: { es: "Sitio web.", en: "Informational website." },
    about: { es: "Sitio web informativo e institucional para 1n.", en: "Informational website for 1n." },
    stack: ["Web"], role: "Dev", client: "1n"
  },
  {
    id: 9, year: 2021, title: "Domainer", type: "Emprendimiento Propio", industry: "Automation", images: dummyImages,
    desc: { es: "Automatización dominios.", en: "Domain automation." },
    about: { es: "Software online que verifica periódicamente la disponibilidad de dominios y los compra o renueva automáticamente.", en: "Online software that periodically checks domains availability and buys or renews them automatically." },
    stack: ["Automation", "Elder Framework"], role: "Dev", client: "Personal"
  },
  {
    id: 10, year: 2021, title: "VetMaster", type: "Emprendimiento Propio", industry: "Health / SaaS", images: dummyImages,
    desc: { es: "SaaS veterinaria.", en: "Veterinary management SaaS." },
    about: { es: "VetMaster es un software de gestión veterinaria que permite manejar tus fichas de pacientes desde cualquier dispositivo a un precio increíble.", en: "VetMaster is a veterinary management software allowing you to manage patient records from any device at an incredible price." },
    stack: ["SaaS", "Health"], role: "Creator", client: "VetMaster"
  },
  {
    id: 11, year: 2021, title: "Garetto", type: "Consultoría", industry: "E-commerce", images: dummyImages,
    desc: { es: "Diseño timbres.", en: "Visual stamp design." },
    about: { es: "Plataforma web para diseñar visualmente y comprar timbres de goma online.", en: "Online web platform for visually designing and buying paper stamps." },
    stack: ["Visual Editor", "E-com"], role: "Dev", client: "Garetto"
  },
  {
    id: 12, year: 2019, title: "Add Shop", type: "Arquitectura / Liderazgo", industry: "Social / E-com", images: dummyImages,
    desc: { es: "Marketplace (CTO).", en: "Marketplace and Social Network (CTO)." },
    about: { es: "Como CTO, estuve a cargo de diseñar y construir el framework sobre el cual construimos una red social y un marketplace, además de formar el equipo de desarrollo. Financiado por 500 Startups México.", en: "As CTO, I designed and built the framework for a social network and marketplace. Funded by 500 Startups." },
    stack: ["Leadership", "Elder Framework"], role: "CTO", client: "Add Shop"
  },
  {
    id: 13, year: 2019, title: "MERA", type: "Emprendimiento Propio", industry: "Gaming", images: dummyImages,
    desc: { es: "MMO Precolombino.", en: "Pre-Columbian MMO Prototype." },
    about: { es: "Prototipo de un juego MMO de mundo abierto ambientado en la América precolombina.", en: "Prototype of a multiplayer open-world game about pre-Columbian America." },
    stack: ["Game Dev", "Multiplayer"], role: "Dev", client: "Personal"
  },
  {
    id: 14, year: 2019, title: "GESTIENDA", type: "Consultoría", industry: "Retail", images: dummyImages,
    desc: { es: "POS.", en: "POS and inventory management." },
    about: { es: "GESTIENDA es un software de punto de venta (POS), que aún no se ha lanzado al mercado. Construido para tiendas para gestionar su inventario, ventas y clientes.", en: "GESTIENDA is a POS software not yet released. Built for stores to manage their inventory, sales, and customers." },
    stack: ["SaaS", "Elder Framework"], role: "Dev", client: "Retail"
  },
  {
    id: 15, year: 2019, title: "ETP", type: "Consultoría", industry: "Enterprise", images: dummyImages,
    desc: { es: "Gestión B2B.", en: "B2B Knowledge Management." },
    about: { es: "Software SaaS para gestión del conocimiento, desarrollado para una empresa B2B que lo vende a sus clientes.", en: "SaaS software for knowledge management, developed for a company who sells it to their customers." },
    stack: ["Enterprise", "Elder Framework"], role: "Dev", client: "B2B"
  },
  {
    id: 16, year: 2017, title: "Psico Plus", type: "Consultoría", industry: "Health", images: dummyImages,
    desc: { es: "Software psicólogos.", en: "Software for psychologists." },
    about: { es: "Software para psicólogos que les permite gestionar sus pacientes, citas y pagos.", en: "Software for psychologists, that allows them to manage their patients, appointments, and payments." },
    stack: ["Health", "Elder Framework"], role: "Dev", client: "Health"
  },
  {
    id: 17, year: 2017, title: "Elder", type: "Arquitectura / Liderazgo", industry: "DevTools", images: dummyImages,
    desc: { es: "Framework propio.", en: "Own modular framework." },
    about: { es: "Framework modular que me permitió crear fácilmente múltiples softwares pequeños usando mis propios bloques preconstruidos.", en: "Modular framework that allowed me to easily create multiple small software with my own prebuilt blocks." },
    stack: ["Framework", "Architecture"], role: "Architect", client: "Personal"
  },
  {
    id: 18, year: 2017, title: "Namelty", type: "Emprendimiento Propio", industry: "Web Tool", images: dummyImages,
    desc: { es: "Buscador dominios.", en: "Smart domain finder." },
    about: { es: "Web app para encontrar nombres de dominio perfectos para startups, que encuentra los caminos más cortos para una palabra y disponibilidad en redes sociales.", en: "Web app for finding perfect domain names for startups, finding shortest ways and availability." },
    stack: ["Web", "Tool"], role: "Creator", client: "Startups"
  },
  {
    id: 19, year: 2014, title: "Grafork", type: "Emprendimiento Propio", industry: "Data Viz", images: dummyImages,
    desc: { es: "Grafos real-time.", en: "Real-time graph management." },
    about: { es: "Software para gestionar grafos de manera colaborativa online en tiempo real.", en: "Software for managing graphs collaboratively online in real time." },
    stack: ["Real-time", "Data"], role: "Dev", client: "Personal"
  },
  {
    id: 20, year: 2014, title: "Tablu", type: "Emprendimiento Propio", industry: "Data Tool", images: dummyImages,
    desc: { es: "Constructor XLS.", en: "Visual XLS builder." },
    about: { es: "Software para construir archivos XLS exportables seleccionando visualmente tablas y relaciones.", en: "Software for building exportable XLS files by visually selecting tables and relationships." },
    stack: ["Data", "XLS"], role: "Dev", client: "Personal"
  },
  {
    id: 21, year: 2012, title: "Elast", type: "Consultoría", industry: "DevOps", images: dummyImages,
    desc: { es: "Gestión AWS.", en: "AWS EC2 and console management." },
    about: { es: "Software para gestionar múltiples instancias EC2 en AWS y sus consolas BASH en tiempo real.", en: "Software for managing multiple EC2 instances in AWS and their BASH consoles in real time." },
    stack: ["AWS", "Real-time"], role: "Dev", client: "DevOps"
  },
  {
    id: 22, year: 2012, title: "HAL", type: "Consultoría", industry: "AdTech", images: dummyImages,
    desc: { es: "Google Ads.", en: "Google Ads management." },
    about: { es: "Software para gestionar palabras clave y grupos de búsqueda de Google Ads.", en: "Software for managing Google Ad keywords and search groups." },
    stack: ["API", "Ads"], role: "Dev", client: "Marketing"
  },
  {
    id: 23, year: 2012, title: "Jaraneo", type: "Emprendimiento Propio", industry: "Culture", images: dummyImages,
    desc: { es: "Eventos culturales.", en: "Cultural events portal." },
    about: { es: "Sitio web cultural sobre actividades interesantes para hacer en la ciudad, donde los organizadores podían publicar sus eventos y pagar por destacados.", en: "Cultural website about interesting activities to do in the city, where organizers could post their events." },
    stack: ["Web", "Portal"], role: "Creator", client: "City"
  },
  {
    id: 24, year: 2010, title: "Vetter", type: "Consultoría", industry: "Health", images: dummyImages,
    desc: { es: "Pacientes veterinarios.", en: "Veterinary patient management." },
    about: { es: "Software web para gestionar pacientes veterinarios y visitas (Precursor de VetMaster).", en: "Web software for managing veterinary patients and visits." },
    stack: ["Web", "Legacy"], role: "Dev", client: "Vets"
  },
  {
    id: 25, year: 2010, title: "Let's go Chile", type: "Consultoría", industry: "E-commerce", images: dummyImages,
    desc: { es: "Turismo online.", en: "Tourism online sales." },
    about: { es: "Software que permitía a mi cliente vender online y gestionar datos sensibles de sus clientes de turismo.", en: "Software that allowed my client to sell online and manage their client’s sensitive data." },
    stack: ["E-com", "Security"], role: "Dev", client: "Tourism"
  },
  {
    id: 26, year: 2008, title: "Art & Music", type: "Consultoría", industry: "Retail", images: dummyImages,
    desc: { es: "Arriendo películas.", en: "Movie rental." },
    about: { es: "Plataforma de arriendo de películas conectada a la base de datos interna de un software comercial para sincronizar ventas en tiempo real.", en: "Movie rental platform that connected to the internal database of a commercial software to sync sales in real time." },
    stack: ["DB", "Integration"], role: "Dev", client: "Retail"
  },
  {
    id: 27, year: 2008, title: "Federación Sionista", type: "Consultoría", industry: "Web", images: dummyImages,
    desc: { es: "CMS noticias.", en: "News CMS." },
    about: { es: "Implementación de mi sistema de gestión de noticias (Nius) en el sitio web de la organización.", en: "Implemented my news managing system (Nius) on the Sionamlat’s website." },
    stack: ["CMS", "Web"], role: "Dev", client: "NGO"
  },
  {
    id: 28, year: 2008, title: "Ejercicios.cl", type: "Emprendimiento Propio", industry: "Education", images: dummyImages,
    desc: { es: "Ejercicios matemáticos.", en: "Math exercises platform." },
    about: { es: "Plataforma pública de ejercicios matemáticos que los estudiantes podían descargar y resolver, a cambio de datos personales.", en: "Public math exercises platform which students could download and solve." },
    stack: ["Web", "Education"], role: "Creator", client: "Students"
  },
  {
    id: 29, year: 2006, title: "Arconte", type: "Arquitectura / Liderazgo", industry: "Software", images: dummyImages,
    desc: { es: "CMS PHP.", en: "Proprietary PHP CMS." },
    about: { es: "CMS (Content Management System) hecho en PHP, que permitía a mis clientes gestionar los sitios web que les vendía.", en: "Content Management System made in PHP, that allowed my clients to manage the websites I sold them." },
    stack: ["PHP", "CMS"], role: "Creator", client: "Clients"
  },
  {
    id: 30, year: 2006, title: "Academia", type: "Consultoría", industry: "EdTech", images: dummyImages,
    desc: { es: "Plataforma educativa.", en: "Educational platform." },
    about: { es: "Plataforma educativa que permitía a los estudiantes de mi cliente obtener materiales y enviar sus pruebas, y a los padres revisar el progreso.", en: "Educational platform that allowed my client’s students to get materials and submit their tests." },
    stack: ["PHP", "EdTech"], role: "Dev", client: "Education"
  },
  {
    id: 31, year: 2006, title: "Altaminux", type: "Consultoría", industry: "DevTools", images: dummyImages,
    desc: { es: "IDE Web.", en: "Web programming platform." },
    about: { es: "Plataforma de programación basada en web que permitía escribir y previsualizar código PHP en un servidor Linux.", en: "Web-based programming platform that allowed writing and previewing PHP code." },
    stack: ["Linux", "PHP"], role: "Dev", client: "Education"
  },
  {
    id: 32, year: 2006, title: "Polerones", type: "Emprendimiento Propio", industry: "Utilities", images: dummyImages,
    desc: { es: "Registro de deudores.", en: "Debtor tracking." },
    about: { es: "Plataforma basada en web para llevar el registro de deudores de cuotas, actualizable en tiempo real.", en: "Web-based platform to keep track of whip-round debtors." },
    stack: ["Web"], role: "Dev", client: "Personal"
  },
  {
    id: 33, year: 2004, title: "Ni Uno", type: "Emprendimiento Propio", industry: "Marketing", images: dummyImages,
    desc: { es: "SEO Ads.", en: "SEO ad platform." },
    about: { es: "Plataforma pública de publicación de anuncios enfocada en posicionamiento SEO.", en: "Public ad publishing platform focused on SEO positioning." },
    stack: ["SEO", "Web"], role: "Creator", client: "Public"
  },
  {
    id: 34, year: 2004, title: "Poggio", type: "Consultoría", industry: "Web", images: dummyImages,
    desc: { es: "Web legal.", en: "Legal web (Brazil)." },
    about: { es: "Sitio web para un bufete de abogados brasileño que incluía mi sistema de gestión de noticias (Nius) y plantillas dinámicas.", en: "Website for a brazilian law firm that included my news managing system (Nius)." },
    stack: ["Web", "CMS"], role: "Dev", client: "Law Firm"
  },
  {
    id: 35, year: 2004, title: "Olsia", type: "Emprendimiento Propio", industry: "Gaming", images: dummyImages,
    desc: { es: "Estrategia web.", en: "Multiplayer strategy game." },
    about: { es: "Juego multijugador basado en web sobre construir un imperio y conquistar los de otros jugadores.", en: "Web-based multiplayer game about building an empire." },
    stack: ["Game Dev", "Strategy"], role: "Creator", client: "Personal"
  },
  {
    id: 36, year: 2004, title: "Nius", type: "Arquitectura / Liderazgo", industry: "Software", images: dummyImages,
    desc: { es: "Gestor noticias.", en: "News management system." },
    about: { es: "Sistema de gestión de noticias para sitios web, implementado y personalizado para muchos de mis clientes.", en: "News management system for websites." },
    stack: ["CMS"], role: "Architect", client: "Clients"
  },
  {
    id: 37, year: 2002, title: "ArgenContable", type: "Consultoría", industry: "Utilities", images: dummyImages,
    desc: { es: "Procesador mIRC.", en: "Accounting processor (mIRC)." },
    about: { es: "Herramienta que ayudaba a procesar por lotes archivos Excel para generar informes contables, programada usando scripting mIRC.", en: "Summary tool that helped batch-process Excel files." },
    stack: ["Scripting", "Automation"], role: "Dev", client: "Accounting"
  },
  {
    id: 38, year: 2002, title: "Master Ice Dark", type: "Emprendimiento Propio", industry: "Software", images: dummyImages,
    desc: { es: "Scripts mIRC.", en: "mIRC script pack." },
    about: { es: "Pack de scripts para mIRC que cambiaba la apariencia general del cliente de chat.", en: "mIRC scripts pack that changed the overall appearance." },
    stack: ["Scripting"], role: "Creator", client: "Community"
  },
  {
    id: 39, year: 1999, title: "Granville", type: "Consultoría", industry: "Web", images: dummyImages,
    desc: { es: "Web escolar.", en: "School website." },
    about: { es: "Hice un pequeño sitio web para mi escuela, como proyecto de fin de año.", en: "Small website for my school as an end-year project." },
    stack: ["HTML"], role: "Student", client: "School"
  },
  {
    id: 40, year: 1999, title: "CAA", type: "Emprendimiento Propio", industry: "Personal", images: dummyImages,
    desc: { es: "Primera web.", en: "My first web (11 years old)." },
    about: { es: "A la edad de 11 años, creé mi primer sitio web en Microsoft Frontpage, con fotos de las mascotas de los vecinos.", en: "My first website in Microsoft Frontpage with pictures of neighbours' pets." },
    stack: ["Frontpage"], role: "Child", client: "Self"
  },
  {
    id: 41, year: 1996, title: "First Program", type: "Emprendimiento Propio", industry: "Origins", images: dummyImages,
    desc: { es: "Primer código.", en: "First code (BASIC)." },
    about: { es: "A la edad de 8 años, fui introducido al lenguaje de programación BASIC por un primo, lo que me permitió crear mi primer código.", en: "At age 8, I created my first piece of code in BASIC." },
    stack: ["BASIC"], role: "Child", client: "Self"
  }
];

const translations = {
  es: { card_role: "Rol", card_year: "Año", card_client: "Cliente", modal_btn: "Ver Detalles ↘" }
};

/* =========================================
   4. LOGICA GRID & EXPANDER
   ========================================= */

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const expander = document.getElementById('project-expander');
  if (expander && expander.parentElement === grid) {
    document.body.appendChild(expander);
    closeExpander();
  }

  grid.innerHTML = '';

  const indVal = document.getElementById('industry-select').value;
  const techVal = document.getElementById('tech-select').value;
  const typeVal = document.getElementById('type-select').value;

  currentFilteredProjects = projectsData.filter(p => {
    const matchInd = indVal === 'all' || p.industry === indVal;
    const matchTech = techVal === 'all' || (p.stack && p.stack.includes(techVal));
    const matchType = typeVal === 'all' || p.type === typeVal;
    return matchInd && matchTech && matchType;
  }).sort((a, b) => b.year - a.year);

  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = currentFilteredProjects.length;

  currentFilteredProjects.forEach((p, index) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.id = `project-${p.id}`;
    card.dataset.index = index;

    const t = translations['es'];
    const shortDesc = p.desc.es || p.desc;
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : "img/dummy.png";

    card.innerHTML = `
            <div class="project-thumb" style="background-image: url('${imgUrl}')"></div>
            <div class="card-content">
                <div>
                    <div class="card-tags">${(p.stack || []).slice(0, 3).map(tag => `<span class="mini-tag">${tag}</span>`).join('')}</div>
                    <h3>${p.title}</h3>
                    <p class="short-desc">${shortDesc}</p>
                </div>
                <div class="card-footer">
                    <span>#${p.industry}</span>
                    <span style="color:var(--accent); font-weight:700;">${t.modal_btn}</span>
                </div>
            </div>
        `;

    if (window.gsap) gsap.from(card, { opacity: 0, y: 30, duration: 0.5, delay: index * 0.05 });

    card.addEventListener('click', () => activateExpander(card, p));
    grid.appendChild(card);
  });
}

function navigateProject(direction) {
  if (!activeCardId || currentFilteredProjects.length === 0) return;

  const currentIdNum = parseInt(activeCardId.replace('project-', ''));
  const currentIndex = currentFilteredProjects.findIndex(p => p.id === currentIdNum);
  if (currentIndex === -1) return;

  let newIndex = currentIndex + direction;
  if (newIndex >= currentFilteredProjects.length) newIndex = 0;
  if (newIndex < 0) newIndex = currentFilteredProjects.length - 1;

  const nextProject = currentFilteredProjects[newIndex];
  const nextCard = document.getElementById(`project-${nextProject.id}`);

  if (nextCard) {
    performFluidTransition(nextCard, nextProject);
  }
}

function performFluidTransition(nextCard, nextProjectData) {
  const expander = document.getElementById('project-expander');
  const content = expander.querySelector('.expander-content');

  content.classList.add('fading-out');

  setTimeout(() => {
    document.querySelectorAll('.project-card').forEach(c => c.classList.remove('active-card'));
    nextCard.classList.add('active-card');
    activeCardId = nextCard.id;

    const grid = document.getElementById('projects-grid');
    const allCards = Array.from(grid.children).filter(c => c.classList.contains('project-card'));
    const nextCardIndex = allCards.indexOf(nextCard);

    const gridStyle = window.getComputedStyle(grid);
    const colCount = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;
    const rowNum = Math.floor(nextCardIndex / colCount);
    let targetIndex = (rowNum + 1) * colCount - 1;
    if (targetIndex >= allCards.length) targetIndex = allCards.length - 1;
    const targetCard = allCards[targetIndex];

    if (expander.previousElementSibling !== targetCard && expander.nextElementSibling !== targetCard.nextElementSibling) {
      targetCard.insertAdjacentElement('afterend', expander);
    }

    populateExpander(nextProjectData);
    movePointer(nextCard, expander);

    const expanderRect = expander.getBoundingClientRect();
    if (expanderRect.top < 0 || expanderRect.bottom > window.innerHeight) {
      const targetScroll = (expander.getBoundingClientRect().top + window.scrollY) - 100;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    requestAnimationFrame(() => {
      content.classList.remove('fading-out');
    });

  }, 300);
}

function activateExpander(card, projectData) {
  const grid = document.getElementById('projects-grid');
  let expander = document.getElementById('project-expander');

  if (!expander) { createExpanderElement(); expander = document.getElementById('project-expander'); }

  if (activeCardId && activeCardId !== card.id && expander.classList.contains('open')) {
    performFluidTransition(card, projectData);
    return;
  }

  if (activeCardId === card.id && expander.classList.contains('open')) {
    closeExpander();
    return;
  }

  if (!activeCardId) { savedScrollPosition = window.scrollY; }

  activeCardId = card.id;

  document.body.classList.add('project-open');

  document.querySelectorAll('.project-card').forEach(c => c.classList.remove('active-card'));
  card.classList.add('active-card');

  const allCards = Array.from(grid.children).filter(c => c.classList.contains('project-card'));
  const cardIndex = allCards.indexOf(card);
  const gridComputedStyle = window.getComputedStyle(grid);
  const gridColumnCount = gridComputedStyle.getPropertyValue('grid-template-columns').split(' ').length;

  const rowNumber = Math.floor(cardIndex / gridColumnCount);
  let lastCardInRowIndex = (rowNumber + 1) * gridColumnCount - 1;
  if (lastCardInRowIndex >= allCards.length) lastCardInRowIndex = allCards.length - 1;

  const referenceCard = allCards[lastCardInRowIndex];

  const openAndScroll = () => {
    populateExpander(projectData);
    movePointer(card, expander);

    void expander.offsetWidth;
    expander.classList.add('open');

    setTimeout(() => {
      const expanderRect = expander.getBoundingClientRect();
      const expanderTop = expanderRect.top + window.scrollY;
      const windowHeight = window.innerHeight;
      const expanderHeight = expander.offsetHeight;

      let targetScroll = expanderTop - (windowHeight - expanderHeight) / 2;
      if (window.innerWidth < 768) { targetScroll = expanderTop - 80; }

      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }, 300);
  };

  if (expander.nextElementSibling !== referenceCard.nextElementSibling) {
    expander.classList.remove('open');
    setTimeout(() => {
      referenceCard.insertAdjacentElement('afterend', expander);
      openAndScroll();
    }, 200);
  } else {
    openAndScroll();
  }
}

function movePointer(card, expander) {
  const pointer = expander.querySelector('.expander-pointer');
  if (!pointer) return;
  const cardRect = card.getBoundingClientRect();
  const gridRect = document.getElementById('projects-grid').getBoundingClientRect();
  const relativeLeft = cardRect.left - gridRect.left + (cardRect.width / 2);
  pointer.style.left = `${relativeLeft}px`;
}

function createExpanderElement() {
  if (document.getElementById('project-expander')) return;

  const expander = document.createElement('div');
  expander.id = 'project-expander';
  expander.className = 'project-expander';

  expander.innerHTML = `
        <div class="expander-pointer"></div>
        <div class="expander-content">
            <button class="nav-arrow-side prev" aria-label="Proyecto anterior">❮</button>
            <button class="nav-arrow-side next" aria-label="Proyecto siguiente">❯</button>
            
            <div class="expander-gallery" id="expander-gallery"></div>
            <div class="expander-info" id="expander-info">
                <button class="close-expander-btn" aria-label="Cerrar detalles">✕</button>
                <div id="expander-details-wrapper"></div>
            </div>
        </div>
    `;

  expander.querySelector('.close-expander-btn').addEventListener('click', closeExpander);

  expander.querySelector('.nav-arrow-side.prev').addEventListener('click', (e) => { e.stopPropagation(); navigateProject(-1); });
  expander.querySelector('.nav-arrow-side.next').addEventListener('click', (e) => { e.stopPropagation(); navigateProject(1); });

  const grid = document.getElementById('projects-grid');
  if (grid) grid.appendChild(expander);
}

function populateExpander(p) {
  const galleryContainer = document.getElementById('expander-gallery');
  const detailsWrapper = document.getElementById('expander-details-wrapper');
  const infoContainer = document.getElementById('expander-info');
  const t = translations['es'];

  galleryContainer.innerHTML = '';
  if (p.images && p.images.length > 0) {
    initGallery(galleryContainer, p.images);
  } else {
    galleryContainer.innerHTML = '<div style="color:var(--text-secondary); height:100%; display:flex; align-items:center; justify-content:center; border:1px dashed var(--glass-border); border-radius:12px;">No images</div>';
  }

  const shortDesc = p.desc.es || p.desc;
  const longDesc = p.about ? (p.about.es || p.about) : shortDesc;
  const tagsHtml = (p.stack || []).map(tag => `<span class="mini-tag">${tag}</span>`).join('');

  detailsWrapper.innerHTML = `
        <h2 class="expander-title">${p.title}</h2>
        <div class="expander-subtitle">${p.industry}</div>
        <div class="expander-tags">${tagsHtml}</div>
        <div class="expander-meta">
            <div><strong>${t.card_role}</strong><br>${p.role}</div>
            <div><strong>${t.card_year}</strong><br>${p.year}</div>
            <div style="grid-column: 1 / -1;"><strong>${t.card_client}</strong><br>${p.client}</div>
        </div>
        <div class="expander-desc"><p>${longDesc}</p></div>
    `;

  const currentIndex = currentFilteredProjects.findIndex(proj => proj.id === p.id);
  if (currentIndex !== -1) {
    const prevIndex = (currentIndex - 1 + currentFilteredProjects.length) % currentFilteredProjects.length;
    const nextIndex = (currentIndex + 1) % currentFilteredProjects.length;
    const prevProj = currentFilteredProjects[prevIndex];
    const nextProj = currentFilteredProjects[nextIndex];

    const oldFooter = infoContainer.querySelector('.project-nav-footer');
    if (oldFooter) oldFooter.remove();

    const footer = document.createElement('div');
    footer.className = 'project-nav-footer';
    footer.innerHTML = `
            <div class="nav-block prev">
                <span class="nav-label">← Anterior</span>
                <span class="nav-title">${prevProj.title}</span>
            </div>
            <div class="nav-block next">
                <span class="nav-label">Siguiente →</span>
                <span class="nav-title">${nextProj.title}</span>
            </div>
        `;
    footer.querySelector('.nav-block.prev').addEventListener('click', () => navigateProject(-1));
    footer.querySelector('.nav-block.next').addEventListener('click', () => navigateProject(1));
    infoContainer.appendChild(footer);
  }
}

function closeExpander() {
  const expander = document.getElementById('project-expander');
  if (expander) {
    expander.classList.remove('open');
  }
  document.body.classList.remove('project-open');

  if (activeCardId) {
    const card = document.getElementById(activeCardId);
    if (card) {
      setTimeout(() => {
        const headerOffset = 140;
        const cardTop = card.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: cardTop - headerOffset, behavior: 'smooth' });
      }, 100);
    }
  }

  activeCardId = null;
  document.querySelectorAll('.project-card').forEach(c => c.classList.remove('active-card'));
}

function initGallery(container, images) {
  let currentIndex = 0;

  const mainView = document.createElement('div');
  mainView.className = 'gallery-main';

  const mainImg = document.createElement('img');
  mainImg.src = images[0];
  mainView.appendChild(mainImg);

  if (images.length > 1) {
    const prevBtn = document.createElement('div'); prevBtn.className = 'gallery-nav-btn prev'; prevBtn.textContent = '❮';
    const nextBtn = document.createElement('div'); nextBtn.className = 'gallery-nav-btn next'; nextBtn.textContent = '❯';

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); updateIndex(currentIndex - 1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); updateIndex(currentIndex + 1); });

    mainView.appendChild(prevBtn);
    mainView.appendChild(nextBtn);
  }

  const thumbRow = document.createElement('div');
  thumbRow.className = 'thumbnails-row';

  images.forEach((src, idx) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
    thumb.addEventListener('click', (e) => { e.stopPropagation(); updateIndex(idx); });
    thumbRow.appendChild(thumb);
  });

  container.appendChild(mainView);
  container.appendChild(thumbRow);

  function updateIndex(newIndex) {
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    currentIndex = newIndex;
    mainImg.style.opacity = '0.4';
    setTimeout(() => {
      mainImg.src = images[currentIndex];
      mainImg.style.opacity = '1';
    }, 150);

    const thumbs = thumbRow.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
      if (i === currentIndex) {
        t.classList.add('active');
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        t.classList.remove('active');
      }
    });
  }
}

/* =========================================
   5. FILTROS
   ========================================= */
function populateFilters() {
  const indSelect = document.getElementById('industry-select');
  const techSelect = document.getElementById('tech-select');
  const typeSelect = document.getElementById('type-select');
  if (!indSelect) return;

  const clean = (sel) => { sel.innerHTML = ''; const o = document.createElement('option'); o.value = 'all'; o.textContent = 'Todas'; sel.appendChild(o); };
  clean(indSelect); clean(techSelect); clean(typeSelect);

  const industries = [...new Set(projectsData.map(p => p.industry))].sort();
  const types = [...new Set(projectsData.map(p => p.type))].sort();
  let allTech = []; projectsData.forEach(p => allTech.push(...p.stack));
  const uniqueTech = [...new Set(allTech)].sort();

  const fill = (sel, arr) => arr.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i; sel.appendChild(o); });
  fill(indSelect, industries); fill(techSelect, uniqueTech); fill(typeSelect, types);
}

function checkResetButton() {
  const indVal = document.getElementById('industry-select').value;
  const techVal = document.getElementById('tech-select').value;
  const typeVal = document.getElementById('type-select').value;
  const btn = document.getElementById('reset-filters');
  if (btn) {
    const isActive = indVal !== 'all' || techVal !== 'all' || typeVal !== 'all';
    btn.classList.toggle('hidden', !isActive);
  }
}

function resetFilters() {
  document.getElementById('industry-select').value = 'all';
  document.getElementById('tech-select').value = 'all';
  document.getElementById('type-select').value = 'all';
  checkResetButton();
  renderProjects();
}

/* =========================================
   6. THEME TOGGLE
   ========================================= */
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = saved ? saved === 'dark' : prefersDark;

  if (shouldBeDark) {
    document.body.classList.remove('light-mode');
    isDarkMode = true;
  } else {
    document.body.classList.add('light-mode');
    isDarkMode = false;
  }
  updateThemeIcon();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDarkMode = e.matches;
      document.body.classList.toggle('light-mode', !e.matches);
      updateThemeIcon();
      if (particleWorker) particleWorker.postMessage({ type: 'theme', isDark: isDarkMode });
    }
  });
}

function updateThemeIcon() {
  const iconEl = document.getElementById('theme-icon');
  if (iconEl) iconEl.textContent = isDarkMode ? '☀' : '🌙';
}

function toggleTheme(event) {
  if (!document.startViewTransition) {
    performThemeChange();
    return;
  }
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => {
    performThemeChange();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      { duration: 500, easing: 'ease-in', pseudoElement: '::view-transition-new(root)' }
    );
  });
}

function performThemeChange() {
  const nowLight = document.body.classList.toggle('light-mode');
  isDarkMode = !nowLight;
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  updateThemeIcon();
  if (particleWorker) particleWorker.postMessage({ type: 'theme', isDark: isDarkMode });
}

/* =========================================
   7. BACKGROUND
   ========================================= */
function initOffscreenCanvasWorker() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas || !('OffscreenCanvas' in window)) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width; canvas.height = rect.height;

  try {
    const offscreen = canvas.transferControlToOffscreen();
    const workerCode = `
            let ctx, width, height, particles = [], isDarkMode = ${isDarkMode}, running = true;
            class Particle {
                constructor() { 
                    this.x = Math.random() * width; this.y = Math.random() * height; 
                    this.vx = (Math.random() - 0.5) * 0.20; this.vy = (Math.random() - 0.5) * 0.20; 
                }
                update() { 
                    this.x += this.vx; this.y += this.vy; 
                    if(this.x < 0 || this.x > width) this.vx *= -1; 
                    if(this.y < 0 || this.y > height) this.vy *= -1; 
                }
                draw() { 
                    ctx.beginPath(); ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2); 
                    ctx.fillStyle = isDarkMode ? 'rgba(0, 242, 255, 0.45)' : 'rgba(0, 120, 212, 0.45)'; 
                    ctx.fill(); 
                }
            }
            function animate() {
                if(!running) { setTimeout(animate, 250); return; }
                ctx.clearRect(0, 0, width, height);
                for(let i = 0; i < particles.length; i++){
                    const p = particles[i]; p.update(); p.draw();
                    for(let j = i + 1; j < particles.length; j++){
                        const q = particles[j]; 
                        const dx = p.x - q.x; const dy = p.y - q.y; const dist2 = dx*dx + dy*dy;
                        if(dist2 < 8000) { 
                            const alpha = 1 - (Math.sqrt(dist2) / 90);
                            ctx.beginPath(); 
                            ctx.strokeStyle = isDarkMode ? \`rgba(0, 242, 255, \${0.12 * alpha})\` : \`rgba(0, 120, 212, \${0.09 * alpha})\`;
                            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                        }
                    }
                }
                requestAnimationFrame(animate);
            }
            self.onmessage = e => { 
                if(e.data.type === 'init') { 
                    ctx = e.data.canvas.getContext('2d'); width = e.data.width; height = e.data.height; particles = []; 
                    const count = Math.min(60, Math.floor((width*height)/(120000))); 
                    for(let i=0; i<count; i++) particles.push(new Particle()); 
                    animate(); 
                }
                if(e.data.type === 'resize') { width = e.data.width; height = e.data.height; }
                if(e.data.type === 'theme') { isDarkMode = e.data.isDark; }
            };
        `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    particleWorker = new Worker(URL.createObjectURL(blob));
    particleWorker.postMessage({ type: 'init', canvas: offscreen, width: window.innerWidth, height: window.innerHeight }, [offscreen]);
    window.addEventListener('resize', () => { particleWorker.postMessage({ type: 'resize', width: window.innerWidth, height: window.innerHeight }); });
  } catch (e) { console.warn("Canvas worker init failed", e); }
}

/* =========================================
   INICIALIZACIÓN
   ========================================= */
initTheme();
setupEventListeners();
populateFilters();
renderProjects();
initOffscreenCanvasWorker();

if (!document.getElementById('project-expander')) {
  createExpanderElement();
}
