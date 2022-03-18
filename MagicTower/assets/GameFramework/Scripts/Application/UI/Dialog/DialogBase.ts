import { Enum, EventTouch, Node, screen, UITransform, _decorator } from "cc";
import { GameFrameworkLog } from "../../../Base/Log/GameFrameworkLog";
import { GameApp } from "../../GameApp";
import { DialogAction } from "./DialogAction";
import { DialogUIForm } from "./DialogUIForm";

const { ccclass, property } = _decorator;

Enum(DialogAction);

@ccclass("DialogBase")
export class DialogBase extends DialogUIForm {
    @property({
        type: UITransform,
        tooltip: "背景区域，用于做点击关闭，及事件屏蔽",
    })
    private touchNode: UITransform = null!;

    @property({
        type: Node,
        tooltip: "弹窗中心内容，适用于做弹窗动作，默认选择弹窗node",
    })
    private dialogContent: Node = null!;

    /** 点击弹窗空白关闭 */
    @property({
        tooltip: "点击弹窗空白关闭",
    })
    private clickBgClose: boolean = false;

    /** 关闭弹窗是否摧毁 */
    @property({
        tooltip: "关闭弹窗是否摧毁,默认不摧毁",
    })
    private closeWithDestroy: boolean = false;

    /** 使用弹窗动作 */
    @property({
        tooltip: "弹窗默认动作",
        type: DialogAction,
    })
    private actionType: DialogAction = DialogAction.NoneAction;

    /** 处理单点或者多点触摸，保证id唯一 */
    private touchId: number | null = null;

    /** 加载背景按钮等初始化 */
    __preload() {
        if (this.touchNode) {
            this.touchNode.contentSize = screen.windowSize;

            this.touchNode.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.touchNode.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.touchNode.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.touchNode.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
        this.dialogContent = this.dialogContent || this.node;
    }

    private onTouchStart(event: EventTouch) {
        event.propagationStopped = true;
        if (this.touchId != null && this.touchId != event.getID()) {
            return;
        }
        GameFrameworkLog.log("dialog onTouchStart");
        this.touchId = event.getID(); //处理多点触摸
    }

    private onTouchMove(event: EventTouch) {
        event.propagationStopped = true;
    }

    private onTouchEnd(event: EventTouch) {
        if (event.getID() == this.touchId) {
            this.touchId = null;
            if (this.clickBgClose) {
                this.close();
            }
            GameFrameworkLog.log("dialog onTouchEnd");
        }
        event.propagationStopped = true;
    }

    /** 关闭弹窗 */
    close(useAction: boolean = true) {
        GameApp.UIManager.closeUIForm(this);
    }
}
