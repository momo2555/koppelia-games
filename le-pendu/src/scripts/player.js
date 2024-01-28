
class Player {
    constructor (id) {
        this.id = id;
        this.name = '';
        this.bloc = false;
        this.colorTab =  ['#1108D5', '#BE1616', '#D9DC22', '#18B82E', '#FFFFFF', '#F61300', '#FF9FF3', '#949494', '#966129', '#FFFFFF'];
        this.timeBloc;
        this.point = 0;
    }

    setName (name) {
        this.name = name;
    }
    getName () {
        return this.name;
    }

    setId(id)  {
        this.id = id;
    }
    getId()  {
        return this.id;
    }

    toObject() {
        let color  = this.colorTab[this.id];
        return {
            id: this.id,
            name: this.name,
            color: color,
            point: this.point
        }
    }
    blocBuzzer() {
        this.bloc = true;
        this.timeBloc = Date.now();
        
    }
    blocked() {
        if (this.bloc) {
            if (Date.now() - this.timeBloc > 7000) {
                this.bloc = false;
            }
        }
        return this.bloc;
    }
    right() {
        this.point+=3;
    }
    
}

module.exports = Player;