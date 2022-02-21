import { GameFrameworkError } from "../../Base/GameFrameworkError";
import { IUIManager } from "../../UI/IUIManager";
import { ToastType } from "./Toast/ColorToast";
import { UIConstant } from "./UIConstant";

export class UIFactory {
    private static _toastAssetPath: string = "";
    private static _uiManager: IUIManager = null!;

    static setToastAssetPath(path: string): void {
        if (!path) {
            throw new GameFrameworkError("toast asset path is invalid");
        }
        this._toastAssetPath = path;
    }

    static setUIManager(uiManager: IUIManager): void {
        this._uiManager = uiManager;
    }

    /**
     * 打开弹窗界面
     * @param path 弹窗界面资源名称
     * @param userData 用户数据
     * @param pauseCoveredUIForm 是否暂停被覆盖的界面
     * @returns 界面序列编号
     */
    static showDialog(path: string, userData?: object, pauseCoveredUIForm?: boolean): Promise<number> {
        return this._uiManager.openUIForm(path, UIConstant.DIALOG_LAYER_GROUP, userData, pauseCoveredUIForm);
    }

    /**
     * 打开飘字界面
     * @param content 飘字界面内容
     * @param toastType 飘字界面类型，正常白字或者富文本
     * @returns 界面序列编号
     */
    static showToast(content: string, toastType: ToastType = ToastType.NORAML): Promise<number> {
        return this._uiManager.openUIForm(this._toastAssetPath, UIConstant.TOAST_LAYER_GROUP, { content: content, toastType: toastType });
    }
}
