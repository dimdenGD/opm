const placeholder = require("../img/placeholder.png");

export class PackageItem {
	constructor(data, installed) {
		// General
		this.name = data.name;
		this.version = data.version;
		this.author = data.author;
		this.description = data.description;
		this.categories = data.categories;
		this.dependencies = data.dependencies;
		this.downloads = data.installs;
		
		// Personal
		this.installed = installed;
		
		// DOM
		this.element = document.createElement("li");
		
		let thumb = document.createElement("img");
		thumb.src = `https://opm.glitch.me/packages/${this.name}/thumb.png`;
		thumb.addEventListener("error", () => {
			thumb.src = placeholder;
		});
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
		
		this.installBtn = document.createElement("button");
		this.installBtn.addEventListener("click", () => {
			if (this.installed) {
				this.uninstall();
			} else {
				this.install();
			}
		});
		this.setInstalled(installed);
		footer.appendChild(this.installBtn);
		
		this.downloadIndicator = document.createElement("span");
		this.downloadIndicator.className = "downloads";
		this.downloadIndicator.textContent = this.downloads;
		footer.appendChild(this.downloadIndicator);
		
		body.appendChild(footer);
		this.element.appendChild(body);
		
		if (this.installed) {
			this.install();
		}
	}
	
	setInstalled(value) {
		this.installBtn.className = value ? "uninstall" : "install";
		this.installBtn.textContent = value ? "Uninstall" : "Install";
	}
	
	async install() {
		if (!this.module) {
			// Install dependencies
			for (let i=0; i<this.dependencies.length; i++) {
				let dep = OPM.packages.find(a => a.name === this.dependencies[i]);
				
				if (dep.installed) continue;
				
				await dep.install();
			}
			
			// Install script
			try {
				let script = await fetch(`https://opm.glitch.me/packages/${this.name}/main.js`).then(a => a.text());
				this.module = eval(script);
			} catch(error) {
				alert("Error while installing script: " + error);
				return;
			}
		}
		
		this.setInstalled(true);
		if (!this.installed) {
			this.downloads++;
			this.downloadIndicator.textContent = this.downloads;
		}
		
		this.module.install();
		this.installed = true;
		fetch(`https://opm.glitch.me/packages/${this.name}/install`, {credentials: "include"});
	}
	
	uninstall() {
		this.setInstalled(false);
		this.downloads--;
		this.downloadIndicator.textContent = this.downloads;
		
		this.module.uninstall();
		this.installed = false;
		fetch(`https://opm.glitch.me/packages/${this.name}/uninstall`, {credentials: "include"});
	}
}

export class Opm {
	constructor() {
		this.packages = [];
		this.installed = [];
		this.element = document.getElementById("opm");
		this.tab = "login";
		
		// Login tab
		document.getElementById("opm-login").addEventListener("click", () => {
			let win = window.open("https://opm.glitch.me/popup", "opm-login", "status=no,location=no,toolbar=no,menubar=no,width=500,height=720,top=100,left=100");
			let interval = setInterval(() => {
				if (!win.closed) return;
				
				clearInterval(interval);
				this.attemptLogin();
			}, 200);
		});
		
		// Packages tab
		this.packList = document.getElementById("opm-packages");
		this.uploadButton = document.createElement("button");
		this.uploadButton.textContent = "Upload script";
		this.uploadButton.addEventListener("click", () => {
			this.switchTab("upload");
		});
		
		// Upload tab
		this.uploadThumbnail = null;
		this.uploadScript = null;
		document.getElementById("opm-upload-image").addEventListener("click", () => {
			let input = document.createElement("input");
			input.type = "file";
			input.addEventListener("change", () => {
				let reader = new FileReader();
				reader.addEventListener("load", () => {
					let data = reader.result;
					if (!data.startsWith("data:image/png;base64,")) {
						return;
					}
					document.getElementById("opm-upload-image").style.backgroundImage = `url(${data})`;
					this.uploadThumbnail = data.slice(22);
				});
				reader.readAsDataURL(input.files[0]);
			});
			input.click();
		});
		document.getElementById("opm-upload-script").addEventListener("change", () => {
			let reader = new FileReader();
			reader.addEventListener("load", () => {
				this.uploadScript = reader.result.split(",")[1];
			});
			reader.readAsDataURL(document.getElementById("opm-upload-script").files[0]);
		});
		document.getElementById("opm-upload-cancel").addEventListener("click", () => {
			this.switchTab("packages");
			document.getElementById("opm-upload-status").textContent = "";
		});
		document.getElementById("opm-upload-upload").addEventListener("click", () => {
			let status = document.getElementById("opm-upload-status");
			
			let name = document.getElementById("opm-upload-name").value;
			let version = document.getElementById("opm-upload-version").value;
			let description = document.getElementById("opm-upload-description").value;
			let categories = document.getElementById("opm-upload-categories").value;
			let dependencies = document.getElementById("opm-upload-dependencies").value;
			
			if (!/^[a-z0-9\-]+$/.test(name)) {
				status.className = "error";
				status.textContent = "Name can only contain a-z 0-9 and dashes";
				return;
			}
			if (name.length > 16) {
				status.className = "error";
				status.textContent = "Name can't be longer than 16 characters";
				return;
			}
			if (!version) {
				status.className = "error";
				status.textContent = "Please provide a version";
				return;
			}
			if (!this.uploadScript) {
				status.className = "error";
				status.textContent = "Please provide a script";
				return;
			}
			
			// Change to fetch
			let xhttp = new XMLHttpRequest();
			xhttp.open("POST", "https://opm.glitch.me/packages/" + name);
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.withCredentials = true;
			xhttp.addEventListener("load", () => {
				if (xhttp.status !== 200) {
					status.className = "error";
					status.textContent = xhttp.response;
					return;
				}
				
				status.className = "success";
				status.textContent = "Upload successful, you script is awaiting approval";
				
				// Reset inputs
				document.getElementById("opm-upload-image").style.backgroundImage = "";
				document.getElementById("opm-upload-name").value = "";
				document.getElementById("opm-upload-version").value = "";
				document.getElementById("opm-upload-description").value = "";
				document.getElementById("opm-upload-categories").value = "";
				document.getElementById("opm-upload-dependencies").value = "";
				document.getElementById("opm-upload-script").value = "";
				this.uploadThumbnail = null;
				this.uploadScript = null;
			});
			xhttp.send(JSON.stringify({
				version: version,
				description: description,
				categories: categories ? categories.split(",") : [],
				dependencies: dependencies ? dependencies.split(",") : [],
				thumb: this.uploadThumbnail,
				code: this.uploadScript
			}));
		});
		
		document.getElementById("opm-header").addEventListener("click", () => {
			this.element.classList.toggle("open");
		});
		
		this.attemptLogin();
	}
	
	attemptLogin() {
		fetch("https://opm.glitch.me/users/me", {
			credentials: "include"
		}).then(a => a.json()).then(user => {
			this.installed = user.installed;
			this.switchTab("packages");
			this.loggedIn();
		}).catch(() => {
			this.switchTab("login");
		});
	}
	
	loggedIn() {
		this.reloadPackages();
	}
	
	reloadPackages() {
		fetch("https://opm.glitch.me/packages").then(a => a.json()).then(packages => {
			this.packages = packages.map(a => new PackageItem(a, this.installed.includes(a.name)));
			this.updatePackageList();
		});
	}
	
	switchTab(tab) {
		this.element.classList.remove(this.tab);
		this.tab = tab;
		this.element.classList.add(this.tab);
	}
	
	updatePackageList() {
		while (this.packList.firstChild) {
			this.packList.removeChild(this.packList.firstChild);
		}
		
		this.packages.forEach(pkg => {
			this.packList.appendChild(pkg.element);
		});
		this.packList.appendChild(this.uploadButton);
	}
	
	// API
	
	require(name) {
		return this.packages.find(a => a.name === name).module;
	}
}
