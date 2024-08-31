//@ts-check

export class PlayListElement {

    constructor(playId, playName, playImage) {
        this.playId = playId;
        this.playImage = playImage;
        this.playName = playName;
    }

    /**
     * 
     * @returns (Object)
     */
    getControllerElemeent() {
        const imgUrl = URL.createObjectURL(this.playImage);
        const id = "play-el-" + this.playId;
        return {
            id: id, content: `
        <div class="play-element" id="${id}">
            <img class="play-element-photo" src="${imgUrl}" />
            <div Class="play-name">
                <p>
                    ${this.playName}
                </p>
            </div>
        </div>
        `};
    }

    /**
     * 
     * @param {Function} callback 
     * @returns 
     */
    getMonitorElement(callback) {
        const imgUrl = URL.createObjectURL(this.playImage);
        const id = "play-el-" + this.playId;
        return `
        `;
    }
}