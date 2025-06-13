import { showModal } from './module/modal/modal.js';
// bookmark = {
// 	id: node.id,
// 	title: node.title,
// 	url: node.url,
// 	urlpath: parsed.host + parsed.pathname,
// 	protocol: parsed.protocol,
// 	host: parsed.host,
// 	pathname: parsed.pathname,
// 	folder: path.join('/'),
// }
// folder = {
// 	id: node.id,
// 	title: node.title,
// 	bookmarkCount: bookmarkCount,
// 	foldersCount: foldersCount,
// 	path: path.join('/')
// }

// Returns a truncated version of the string if it exceeds the specified maximum length, appending an ellipsis.
function truncate(str, maxLength = 20) {
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}
// Returns the count of empty folders in the provided array of folders.
function countEmptyFolders(folders) {
	let emptyCount = 0;
	
	folders.forEach((folder, index) => {
		if (folder.bookmarkCount === 0 && folder.foldersCount === 0) {
			// console.log('Folder:', folderPath, 'is empty');
			emptyCount++;
		}
	});
	return emptyCount;
}
// Returns the count of duplicate bookmarks in the provided URL map.
function countBookmarksDuplicate(urlMap) {
	let doub = 0
	for (const i of urlMap.values()) if (i.length > 1) doub=doub+1;
	return doub;
}
// Deletes all duplicate bookmarks, keeping only the first one for each URL.
function deleteAllDuplicateBookmarks() {
	collectBookmarks(({ urlMap, folderMap, folders }) => {
		for (const [key, value] of urlMap.entries()) {
			if (Array.isArray(value) && value.length > 1) {
				value.forEach((bm, index) => {
					if (index) { // Se non è il primo elemento, allora è un duplicato
						// console.log('Deleting duplicate bookmark:', bm.title, index, 'with URL:', bm);
						chrome.bookmarks.remove(bm.id);
						return true;
					}
				});
			}
		}
	});
}
// Delete all duplicate bookmarks in folder
function deleteBooknmarkDuplicateInFolder(urlMap, folder) {
	for (const [key, host] of urlMap.entries()) {
		if (Array.isArray(host) && host.length > 1) {
			for (const bm of host) {
				if (bm.folder === folder) {
					chrome.bookmarks.remove(bm.id);
					// urlMap.delete(key);
				}
			}
		}
	}
}
// Delete all duplicate bookmarks in folder and his subfolders
function deleteBookmarksDuplicateInFolderAndSub(urlMap, folder) {
	console.log('folder path', folder);
	for (const [key, host] of urlMap.entries()) {
		if (Array.isArray(host) && host.length > 1) {
			for (const bm of host) {
				// console.log('---->', bm.folder.substring(0, folder.length));
				if (bm.folder.substring(0, folder.length) === folder) {
					chrome.bookmarks.remove(bm.id);
					// urlMap.delete(key);
					console.log('---->', bm.folder);
					// console.log(bm.folder);
				}
			}
		}
	}
}
// Delete all empty folders
function deleteEmptyFolders() {
	collectBookmarks(({ urlMap, folderMap, folders }) => {
		// console.log(folders);
		folders.forEach((folder, index) => {
			if (folder.bookmarkCount === 0 && folder.foldersCount === 0) {
				// console.log('Folder:', folderPath, 'is empty', folder.id);
				chrome.bookmarks.remove(folder.id);
			}
		});
	});
}
// Shows the bookmarks list (url-list) contained in a specific folder
function renderFolder(urlMap, folderMap, partial, urlListId) {
	let urlList = document.getElementById(urlListId);
	urlList.innerHTML = ''; // Pulisce il contenuto esistente

	if (partial) {
		urlList.classList.remove('hidden');
		const urlListTitle = document.createElement('div');
		urlListTitle.className = 'url-list-title';
	
		const ul = document.createElement('ul');
		ul.className = 'url-list-ul';
	
		if (folderMap.has(partial)) {
			urlListTitle.textContent = 'Url in this folder:';
			// console.log(folderMap.get(pathString));
			for (const [key, value] of folderMap.get(partial).entries()) {
		
				const url = document.createElement('li');
				url.className = 'url-in-folder';
				const bookmarkNo = urlMap.get(value.url).length
				url.textContent = value.url + ' (' + bookmarkNo + ' bookmarks)';
				if (bookmarkNo > 1) url.classList.add('bookmark-duplicate');
				
				const btn_delete = document.createElement('button');
				btn_delete.className = 'buttonIcon';
				btn_delete.innerHTML = '<i class="fas fa-trash-alt"></i>';
				btn_delete.title = 'Delete this bookmark';
				btn_delete.onclick = () => {
					chrome.bookmarks.remove(value.id);
					url.remove(); // rimuove l'elemento dalla lista
					if (!ul.querySelectorAll('li').length) urlListTitle.textContent = 'No bookmarks in this folder';
					// init(); // aggiorna la pagina
				};
				url.appendChild(btn_delete);
				ul.appendChild(url);
			}
		} else {
			urlListTitle.textContent = 'No bookmarks in this folder';
		}
	
		urlList.appendChild(urlListTitle);
		urlList.appendChild(ul);
	} else {
		urlList.classList.add('hidden');
	}
	// return container; // Restituisce il contenitore con la lista degli URL
}
// Returns a container with buttons for each segment of the folder path, allowing navigation through the folder structure.
function renderFolderPath(urlMap, folderMap, pathString, urlListId) {
	const container = document.createElement('div');
	container.className = 'folder-path';
	container.innerHTML = ''; // pulisce il contenitore

  const parts = pathString.split('/');
	parts.shift(); // rimuove il primo elemento se è vuoto (ad esempio, se il percorso inizia con uno slash)
	
	// console.log('Rendering parts:', parts);
  parts.forEach((part, index) => {
		const partial = parts.slice(0, index + 1).join('/'); // ← ecco il valore corretto

		// console.log('Rendering part:', part, 'Partial path:', partial);
    const button = document.createElement('button');
    button.textContent = part;
    button.className = 'folder-segment';
    button.onclick = async () => {
			if (button.classList.contains('active')) {
				button.classList.remove('active'); // Rimuove la classe se il pulsante è già attivo
				renderFolder(urlMap, folderMap, null, urlListId);
			} else {
				document.querySelectorAll('button.folder-segment').forEach(btn => btn.classList.remove('active'));
				button.classList.add('active'); // Aggiunge una classe per indicare che il pulsante è attivo
				renderFolder(urlMap, folderMap, "/"+partial, urlListId);
			}	
		}

    container.appendChild(button);

    // Aggiunge uno slash visivo tra i pulsanti tranne l'ultimo
    if (index < parts.length - 1) {
      const separator = document.createElement('span');
      separator.textContent = '/';
      container.appendChild(separator);
    }
  });

	return container; // Restituisce il contenitore con i pulsanti
}
// Show the bookmarks list and for each bookmark, show the folder path in which it is contained.
function renderBookmarks(urlMap, folderMap, filterDuplicates = false) {
	const container = document.getElementById('bookmarksList');
	container.innerHTML = '';
	// console.log('Rendering bookmarks:', map);

	// console.log(urlMap);
	// console.log(folderMap);

	for (const [key, host] of urlMap.entries()) {
		if (filterDuplicates && (!Array.isArray(host) || host.length <= 1)) continue; // Se stiamo filtrando i duplicati, salta quelli con un solo bookmark

		// console.log(key,host);

		const div = document.createElement('div');
		div.className = 'bookmark-item';

		const header = document.createElement('div');
		header.className = 'bookmark-header';
		
		const img = document.createElement('img');
		// img.src = `https://www.google.com/s2/favicons?sz=32&domain_url=${host[0].host}`;
		img.alt = 'favicon';
		img.className = 'favicon';

		const title = document.createElement('p');
		title.className = 'bookmark-title';
		title.textContent = key;

		const noUrl = document.createElement('span');
		noUrl.className = 'bookmark-no-url';
		noUrl.textContent = ' (' + host.length + ' bookmarks)';

		const ul = document.createElement('ul');
		
		for (const fold of host) {
			const li = document.createElement('li');
			li.className = 'bookmark-folder';
			
			const link = document.createElement('a');
			link.className = 'bookmark-link';
			link.href = fold.url;
			link.title = fold.url;
			link.target = '_blank';
			link.textContent = truncate(fold.url);
			
			const urlList = document.createElement('div');
			const urlListId = "urlListId_" + fold.id;
			
			urlList.id = urlListId;
			urlList.className = 'url-list';
			urlList.classList.add('hidden');

			const btn_delete = document.createElement('button');
			btn_delete.className = 'buttonIcon';
			btn_delete.innerHTML = '<i class="fas fa-trash-alt"></i>';
			btn_delete.title = 'Delete this bookmark';
			btn_delete.onclick = () => {
				chrome.bookmarks.remove(fold.id);
				li.remove(); // rimuove l'elemento dalla lista
				const countLi = ul.querySelectorAll(':scope > li').length;
				if (countLi === 0) div.remove(); // rimuove il div se non ci sono più elementi
				// init(); // aggiorna la pagina
			};

			const btn_delete_folder = document.createElement('button');
			btn_delete_folder.className = 'buttonIcon';
			btn_delete_folder.innerHTML = '<i class="fa-solid fa-folder-minus"></i>';
			btn_delete_folder.title = 'Delete all bookmarks duplicate in this folder';
			btn_delete_folder.onclick = () => {
				deleteBooknmarkDuplicateInFolder(urlMap, fold.folder);
				init();
			};

			const btn_delete_folder_and_sub = document.createElement('button');
			btn_delete_folder_and_sub.className = 'buttonIcon';
			btn_delete_folder_and_sub.innerHTML = '<i class="fa-solid fa-sitemap"></i>';
			btn_delete_folder_and_sub.title = 'Delete all bookmarks duplicate in this folder and his subfolders';
			btn_delete_folder_and_sub.onclick = () => {
				deleteBookmarksDuplicateInFolderAndSub(urlMap, fold.folder);
				init();
			};

			li.appendChild(renderFolderPath(urlMap, folderMap, fold.folder, urlListId));
			li.appendChild(link);
			li.appendChild(btn_delete);
			li.appendChild(btn_delete_folder);
			li.appendChild(btn_delete_folder_and_sub);
			li.appendChild(urlList);
			ul.appendChild(li);
		}

		header.appendChild(img);
		header.appendChild(title);
		header.appendChild(noUrl);
		div.appendChild(header);
		div.appendChild(ul);
		container.appendChild(div);
	}
}
// Show all empty folders
function renderFolderView(urlMap, folderMap, folders, empty=false) {

	const container = document.getElementById('bookmarksList');
	// console.log('Rendering folder view:', folders);
	container.innerHTML = '';

	folders.forEach((folder, index) => {

		if (!(empty && !(folder.bookmarkCount === 0 && folder.foldersCount === 0))) {

			const div = document.createElement('div');
			div.className = 'folder-item';

			const folderTitle = document.createElement('div');
			folderTitle.className = 'folder-title';
			folderTitle.textContent = folder.path + '/' + folder.title;

			const folderCount = document.createElement('div');
			folderCount.className = 'folder-count';
			folderCount.textContent = folder.bookmarkCount + ' bookmarks and ' + folder.foldersCount + ' folders.';

			// console.log('Folder:', folder, 'is empty', folder.id);

			div.appendChild(folderTitle);
			div.appendChild(folderCount);
			container.appendChild(div);
		}
	});
}
// Costruisce le mappe dei segnalibri
function collectBookmarks(callback) {
	// console.log('Collecting bookmarks...');
  chrome.bookmarks.getTree((nodes) => {
		const folders = [];
		// const allBookmarks = [];
		const urlMap = new Map();
		// const hostMap = new Map();
		// const idMap = new Map();
		const folderMap = new Map();

		// console.log('Collecting bookmarks...', nodes);
    // Funzione ricorsiva per raccogliere i segnalibri con percorso
    function collect(nodes, path = []) {
			
			for (const node of nodes) {
				// console.log(node);
        if (node.url) {
					// node is a bookmark
          let bookmark;
          try {
            const parsed = new URL(node.url);
            bookmark = {
              id: node.id,
              title: node.title,
              url: node.url,
              urlpath: parsed.host + parsed.pathname,
              protocol: parsed.protocol,
              host: parsed.host,
              pathname: parsed.pathname,
              folder: path.join('/'),
            };
          } catch (e) {
            console.error('URL non valido:', node.url);
            continue;
          }
					// allBookmarks.push(bookmark);
					// if (!hostMap.has(bookmark.host)) {
						// hostMap.set(bookmark.host, []);
					// }
					// hostMap.get(bookmark.host).push(bookmark);

					if (!folderMap.has(bookmark.folder)) {
						folderMap.set(bookmark.folder, []);
					}
					folderMap.get(bookmark.folder).push(bookmark);

          if (!urlMap.has(node.url)) {
            urlMap.set(node.url, []);
          }
          urlMap.get(node.url).push(bookmark);

          // idMap.set(node.id, bookmark);
        } else if (node.children) {
					// node is a folder and have children

					// const bookmarkCount = node.children.filter(child => child.url).length;
					const bookmarkCount = node.children.filter((child) => child.url).length;
					const foldersCount = node.children.length - bookmarkCount;

					folders.push({
						id: node.id,
						title: node.title,
						bookmarkCount: bookmarkCount,
						foldersCount: foldersCount,
						path: path.join('/')
					});
					
					collect(node.children, [...path, node.title]);
        }
      }
    }

		collect(nodes);

    callback({ urlMap, folderMap, folders });
  });
}
// Costruisce l'intestazione
function renderHeader(urlMap, folderMap, folders) {

	const totalCount = document.getElementById('totalCount');
	totalCount.textContent = urlMap.size;
	
	const duplicateCount = document.getElementById('duplicateCount');	
	duplicateCount.textContent = countBookmarksDuplicate(urlMap);

	const folderCount = document.getElementById('folderCount');	
	folderCount.textContent = folders.length;
 	
	const folderEmpty = document.getElementById('folderEmpty');	
	folderEmpty.textContent = countEmptyFolders(folders);
}
// Aggiorna i segnalibri e li mostra
function renderBody({ urlMap, folderMap, folders }, view = 'bookmarks') {
	// console.log('==========================================');

	// console.log('allBookmarks:', allBookmarks);
	// console.log('hostMap:', hostMap);
	// console.log('hostMap:', folders);
	document.querySelectorAll('div.tabBar').forEach(cl => cl.classList.remove('active'));
	switch(view) {
		case 'bookmarks':
			document.getElementById('loadBookmarks').classList.add('active');
			renderBookmarks(urlMap, folderMap, false);
			break;
		case 'duplicates':
			document.getElementById('filterDuplicates').classList.add('active');
			renderBookmarks(urlMap, folderMap, true);
			break;
		case 'folders':
			document.getElementById('folders').classList.add('active');
			renderFolderView(urlMap, folderMap, folders);
			break;
		case 'emptyFolders':
			document.getElementById('emptyFolders').classList.add('active');
			renderFolderView(urlMap, folderMap, folders, true);
			break;
		default:
			document.getElementById('loadBookmarks').classList.add('active');
			renderBookmarks(urlMap, folderMap, false);
	}
	// const container = document.getElementById('bookmarksList');
	// container.innerHTML = '';

}

// Page initialization and refreshing
function init() {
	collectBookmarks(({ urlMap, folderMap, folders }) => {
		status = { urlMap, folderMap, folders };
		// console.log({ urlMap, folderMap, folders });
		renderHeader( urlMap, folderMap, folders );
		renderBody({ urlMap, folderMap, folders }, 'bookmarks');
	});
}


let status;
init(); // Inizialization of page e data

// Event management
document.getElementById('loadBookmarks').addEventListener('click', () => renderBody(status, 'bookmarks'));
document.getElementById('filterDuplicates').addEventListener('click', () => renderBody(status, 'duplicates'));
document.getElementById('folders').addEventListener('click', () => renderBody(status, 'folders'));
document.getElementById('emptyFolders').addEventListener('click', () => renderBody(status, 'emptyFolders'));
// Event with modal
document.getElementById('deleteDuplicates').addEventListener('click', async () => {
	const confirmed = await showModal('Delete '+ countBookmarksDuplicate(status.urlMap) +' empty folders?');
  if (confirmed) {
		deleteAllDuplicateBookmarks();
		renderBody(status, 'duplicates');
  }	
});
document.getElementById('deleteEmptyFolders').addEventListener('click', async () => {
	const confirmed = await showModal('Delete '+ countEmptyFolders(status.folders) +' empty folders?');
  if (confirmed) {
		deleteEmptyFolders();
		renderBody(status, 'emptyFolders');
  }
});




