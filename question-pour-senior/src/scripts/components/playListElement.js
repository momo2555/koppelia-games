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
        const id = "play-el-" + this.playId;
        return {
            id: id, content: `
        <div class="play-element" id="${id}">
            <img class="play-element-photo" src="${this.playImage}" />
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
     * @returns 
     */
    getMonitorElement() {
        const id = "play-el-" + this.playId;
        return {
            id: id, content: `<div class="play-element-contain">
                        <div class="play-element" id="${id}">
                            <img class="play-element-photo" src="${this.playImage}" />
                            <div Class="play-name">
                                <p>
                                    ${this.playName}
                                </p>
                            </div>
                        </div>
                    </div>
        `};
    }
}