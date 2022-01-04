// import { Sprite, _decorator } from "cc";
// import { GameManager } from "../../../../Framework/Managers/GameManager";
// import { Actor } from "../Map/Actor/Actor";
// import { ElementManager } from "../Map/ElementManager";

// const { ccclass, property } = _decorator;

// @ccclass("ElementNode")
// export class ElementNode extends Actor {
//     init(layerName: string, id: number | string) {
//         let json = Utility.Json.getJsonElement(layerName, id);
//         if (json) {
//             let name = json.spriteId;
//             this.getComponent(Sprite)!.spriteFrame = ElementManager.getElementSpriteFrame(`${name}_0`);
//             if (this.animation.clips.length == 0) {
//                 this.animation.createState(ElementManager.getElementAnimationClip(name), name);
//             }
//             this.animation.play(name);
//         }
//     }
// }
