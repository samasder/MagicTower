import { Constructor } from "../../Base/DataStruct/Constructor";
import { GameFrameworkError } from "../../Base/GameFrameworkError";
import { GameFrameworkLinkedList, LinkedListNode } from "../../Base/GameFrameworkLinkedList";
import { ISaveManager } from "../../Save/ISaveManager";
import { IModel } from "./IModel";
import { ModelBase } from "./ModelBase";

/**
 * Model容器
 */
export class ModelContainer {
    private static readonly s_modelConstructors: Map<string, Constructor<ModelBase>> = new Map<string, Constructor<ModelBase>>();
    private static readonly s_nameConstructors: Map<Constructor<ModelBase>, string> = new Map<Constructor<ModelBase>, string>();
    private static readonly s_saveKeys: Map<Constructor<ModelBase>, string[]> = new Map<Constructor<ModelBase>, string[]>();
    private readonly _models: GameFrameworkLinkedList<ModelBase> = null!;
    private readonly _cachedModels: Map<Constructor<ModelBase>, ModelBase> = null!;
    private _saveManager: ISaveManager | null = null;

    constructor() {
        this._models = new GameFrameworkLinkedList<ModelBase>();
        this._cachedModels = new Map<Constructor<ModelBase>, ModelBase>();
    }

    /**
     * 模型注册装饰函数
     * @param className 类名
     * @returns
     */
    static registerModel(className: string): (target: Constructor<ModelBase>) => void {
        return (target: Constructor<ModelBase>) => {
            this.s_modelConstructors.set(className, target);
            this.s_nameConstructors.set(target, className);
        };
    }

    /**
     * 根据model实例获取类名
     * @param target model实例
     */
    static getClassName(target: ModelBase): string {
        let name = this.s_nameConstructors.get(target.constructor as Constructor<ModelBase>);
        if (name === undefined) {
            throw new GameFrameworkError("model has not register");
        }
        return name;
    }

    /**
     * 缓存模型需要保存的键名
     * @param model 模型
     * @param key 键名
     */
    static addModelSaveKey(model: Constructor<ModelBase>, key: string): void {
        let keys = this.s_saveKeys.get(model);
        if (!keys) {
            keys = new Array<string>();
            this.s_saveKeys.set(model, keys);
        }
        keys.push(key);
    }

    /**
     * 轮询模型
     * @param elapseSeconds 逻辑流逝时间
     */
    update(elapseSeconds: number) {
        this._models.forEach((modelBase: ModelBase) => {
            modelBase.update(elapseSeconds);
        });
    }

    /**
     * 关闭模型模块
     */
    shutDown() {
        this._models.forEach((modelBase: ModelBase) => {
            modelBase.shutDown();
        });
    }

    /**
     * 设置存储管理器
     * @param saveManager 存储管理器
     */
    setSaveManager(saveManager: ISaveManager): void {
        this._saveManager = saveManager;
    }

    /**
     * 根据模型构造获取模型
     * @param constructor 模型构造器
     * @returns 模型
     */
    getModel<T extends IModel>(constructor: Constructor<T>): T {
        let ctor = constructor as unknown as Constructor<ModelBase>;
        let model = this._cachedModels.get(ctor);
        if (!model) {
            let className = ModelContainer.s_nameConstructors.get(ctor);
            if (className) {
                model = this.createModel(ctor);
            } else {
                throw new GameFrameworkError(`${className} model has not register`);
            }
        }
        return model as unknown as T;
    }

    /**
     * 根据模型类名获取模型
     * @param className 类名
     * @returns 模型
     */
    getModelWithName<T extends IModel>(className: string): T {
        let ctor = ModelContainer.s_modelConstructors.get(className);
        if (ctor) {
            let model = this._cachedModels.get(ctor);
            if (!model) {
                model = this.createModel(ctor);
            }
            return model as unknown as T;
        } else {
            throw new GameFrameworkError(`${className} model has not register`);
        }
    }

    /**
     * 加载本地模型数据
     */
    loadLocalModel(): void {
        if (!this._saveManager) {
            throw new GameFrameworkError("you must set save manager first");
        }
        let modelInfos: Array<{
            model: ModelBase;
            value: object | null;
        }> = [];

        ModelContainer.s_modelConstructors.forEach((ctor, name) => {
            let model = this.getModel(ctor);
            model.setSaveManager(this._saveManager!, name);
            modelInfos.push({
                model: model,
                value: this._saveManager?.getObject(name) || null,
            });
        });

        //模块根据优先级排序
        modelInfos.sort((l, r) => {
            return r.model.priority - l.model.priority;
        });

        /** 加载完数据以后，重定义属性的setter */
        modelInfos.forEach((modelInfo) => {
            modelInfo.model.load(modelInfo.value);
            let saveKeys = ModelContainer.s_saveKeys.get(modelInfo.model.constructor as any);
            console.log(modelInfo.model, saveKeys);
            if (saveKeys) {
                modelInfo.model.defineSetterProperty(saveKeys);
            }
        });
    }

    /**
     * 创建模型
     * @param constructor 模型构造器
     * @returns 模型
     */
    private createModel<T extends ModelBase>(constructor: Constructor<T>): T {
        let model = new constructor();
        let node: LinkedListNode<ModelBase> | null = null;

        if (this._models.size > 0) {
            for (let current = this._models.first; current != null; current = current.next) {
                if (model.priority >= current.value.priority) {
                    node = current;
                    break;
                }
            }
        }

        if (node) {
            this._models.addBefore(node, model);
        } else {
            this._models.addLast(model);
        }

        this._cachedModels.set(constructor, model);

        return model;
    }
}
