export class Package {
	constructor() {
		
	}
	
	destructor() {
		
	}
}

export class PackageItem {
	constructor(data) {
		this.name = data.name;
		this.version = data.version;
		this.author = data.author;
		this.description = data.description;
		this.categories = data.categories;
		
		this.element = document.createElement("li");
		
		let thumb = document.createElement("img");
		thumb.src = data.thumb;
		this.element.appendChild(thumb);
		
		let body = document.createElement("div");
		body.className = "body";
		let header = document.createElement("header");
		let title = document.createElement("span");
		title.className = "title";
		title.textContent = this.name;
		header.appendChild(title);
		
		let version = document.createElement("span");
		version.className = "version";
		version.textContent = this.version;
		header.appendChild(version);
		
		let author = document.createElement("span");
		author.className = "author";
		author.textContent = this.author;
		header.appendChild(author);
		body.appendChild(header);
		
		let description = document.createElement("p");
		description.className = "description";
		description.textContent = this.description;
		body.appendChild(description);
		
		let footer = document.createElement("footer");
		let categories = document.createElement("ul");
		categories.className = "categories";
		for (let i=0; i<this.categories.length; i++) {
			let category = document.createElement("li");
			category.textContent = this.categories[i];
			categories.appendChild(category);
		}
		footer.appendChild(categories);
		
		let install = document.createElement("button");
		install.className = "install";
		install.textContent = "Install";
		footer.appendChild(install);
		body.appendChild(footer);
		this.element.appendChild(body);
	}
}

export class Opm {
	constructor() {
		this.packages = [
			new PackageItem({
				name: "package-1",
				version: "1.0.0",
				author: "author1",
				description: "This is a cool package.",
				categories: ["Script"]
			}),
			new PackageItem({
				name: "package-2",
				version: "1.5.0",
				author: "author2",
				description: "This is a cool package.",
				categories: ["Theme", "Palette"]
			})
		];
		this.element = document.getElementById("opm");
		
		this.packList = document.getElementById("opm-packages");
		
		document.getElementById("opm-header").addEventListener("click", () => {
			this.element.classList.toggle("open");
		});
		
		this.updatePackageList();
	}
	
	updatePackageList() {
		while (this.packList.firstChild) {
			this.packList.removeChild(this.packList.firstChild);
		}
		
		this.packages.forEach(pkg => {
			this.packList.appendChild(pkg.element);
		});
	}
}
