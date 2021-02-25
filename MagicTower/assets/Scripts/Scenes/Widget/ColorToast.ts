import { RichText, UITransform, Vec3, _decorator } from "cc";
import { BasePoolNode } from "../../Frame/Base/BasePoolNode";
const { ccclass, property } = _decorator;

const SHORTEST_LENGTH: number = 180;

@ccclass("ColorToast")
export default class ColorToast extends BasePoolNode {
    @property(RichText)
    toastLabel: RichText | null = null;

    init(content: string) {
        this.toastLabel.string = content;

        let transform = this.node.getComponent(UITransform);
        let labelTransform = this.toastLabel.node.getComponent(UITransform);
        if (labelTransform.width > SHORTEST_LENGTH) {
            transform.width = labelTransform.width + 50;
        } else {
            transform.width = 200;
        }
        this.runToastAction();
    }

    runToastAction() {
        tween(this.node)
            .by(0.5, { position: new Vec3(0, 60, 0) })
            .delay(1)
            .call(() => {
                this.remove();
            })
            .start();
    }
}
