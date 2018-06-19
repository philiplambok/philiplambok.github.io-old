new Vue({
	el: "#app", 
	data: {
		navbarActive: false
	}, 
	methods: {
		toogleNavbar(){
			this.navbarActive = !this.navbarActive
		}
	}
})