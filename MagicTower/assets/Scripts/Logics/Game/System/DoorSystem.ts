import { Node, v3 } from "cc";
import { CommandManager } from "../../../../GameFramework/Scripts/Application/Command/CommandManager";
import { SystemBase } from "../../../../GameFramework/Scripts/Application/Command/SystemBase";
import { GameApp } from "../../../../GameFramework/Scripts/Application/GameApp";
import { GameFrameworkError } from "../../../../GameFramework/Scripts/Base/GameFrameworkError";
import { IVec2 } from "../../../../GameFramework/Scripts/Base/GameStruct/IVec2";
import { Utility } from "../../../../GameFramework/Scripts/Utility/Utility";
import { HeroModel } from "../../../Model/HeroModel/HeroModel";
import { Door, DoorState, DoorType } from "../../../Model/MapModel/Data/Elements/Door";
import { LevelData } from "../../../Model/MapModel/Data/LevelData";
import { CommonEventArgs } from "../../Event/CommonEventArgs";
import { GameEvent } from "../../Event/GameEvent";
import { EventCollisionCommand } from "../Command/EventCollisionCommand";
import { DoorAnimationNode } from "../Elements/DoorAnimaitonNode";
import { DoorAnimationReverseNode } from "../Elements/DoorAnimaitonReverseNode";
import { IGameMap } from "../Map/GameMap/IGameMap";

@CommandManager.register("DoorSystem")
export class DoorSystem extends SystemBase {
    private gameMap: IGameMap = null!;
    private levelData: LevelData = null!;

    awake(): void {
        GameApp.NodePoolManager.createNodePool(DoorAnimationNode);
        GameApp.NodePoolManager.createNodePool(DoorAnimationReverseNode);
    }

    initliaze(gameMap: IGameMap, levelData: LevelData) {
        this.gameMap = gameMap;
        this.levelData = levelData;
    }

    /**
     * 可见的门碰撞处理
     * @param tile 门位置
     * @param layerName 层名
     * @returns 是否该格子可走
     */
    doorCollision(tile: IVec2, layerName: string) {
        let tileIndex = this.gameMap.getTileIndex(tile);

        let doorInfo = this.levelData.getLayerElement<Door>(layerName, tileIndex);
        if (!doorInfo) {
            return true;
        }

        if (doorInfo.canWallOpen()) {
            this.openDoor(doorInfo.id, tile, layerName);
        } else if (doorInfo.isKeyDoor()) {
            let doorJson = Utility.Json.getJsonKeyCache("prop", "value", doorInfo.id) as any;
            if (!doorJson) {
                throw new GameFrameworkError("door json is invaild");
            }
            let keyID = doorJson.id;
            let heroModel = GameApp.getModel(HeroModel);
            if (keyID && heroModel.getPropNum(keyID) > 0) {
                heroModel.addProp(keyID, 1, -1);
                this.openDoor(doorInfo.id, tile, layerName);
                let eventInfo = this.levelData.getLayerInfo(layerName)["event"];
                if (eventInfo && eventInfo.doorState == DoorState.DISAPPEAR_EVENT) {
                    this.disappearEventCollision(eventInfo, tileIndex);
                }
            }
        }

        return true;
    }

    invisibleDoorCollision(tile: IVec2) {
        let layerName = "door";
        let doorLayerInfo = this.levelData.getLayerInfo(layerName);
        if (!doorLayerInfo) {
            return true;
        }
        let tileIndex = this.gameMap.getTileIndex(tile);

        let eventInfo: Door = doorLayerInfo["event"];
        if (eventInfo && eventInfo.doorState == DoorState.APPEAR_EVENT) {
            this.appearEventCollision(eventInfo, tile);
        } else {
            let doorInfo = this.levelData.getLayerElement<Door>(layerName, tileIndex);
            if (doorInfo && doorInfo.doorState == DoorState.APPEAR) {
                this.createDoorAnimation(doorInfo.id, tile, true, () => {
                    this.gameMap.setTileGIDAt(layerName, tile, doorInfo!.gid);
                    GameApp.EventManager.fireNow(this, CommonEventArgs.create(GameEvent.COLLISION_COMPLETE));
                });
            } else {
                return true;
            }
        }

        return false;
    }

    clear(): void {
        super.clear();
        GameApp.NodePoolManager.destroyNodePool(DoorAnimationNode);
        GameApp.NodePoolManager.destroyNodePool(DoorAnimationReverseNode);
    }

    private openDoor(id: number | string, tile: IVec2, layerName: string) {
        this.createDoorAnimation(id, tile, false, () => {
            GameApp.EventManager.fireNow(this, CommonEventArgs.create(GameEvent.COLLISION_COMPLETE));
        });
        this.levelData.deleteLayerElement(layerName, this.gameMap.getTileIndex(tile));
        this.gameMap.setTileGIDAt(layerName, tile, 0);
    }

    private async createDoorAnimation(id: number | string, tile: IVec2, reverse: boolean, callback: Function | null = null) {
        let name = reverse ? "DoorAnimationReverseNode" : "DoorAnimationNode";
        let constructor = reverse ? DoorAnimationReverseNode : DoorAnimationNode;
        let node = (await GameApp.NodePoolManager.createNodeWithPath(constructor, `Prefabs/Elements/${name}`)) as Node;
        if (node) {
            let position = this.gameMap.getPositionAt(tile);
            if (position) {
                node.position = v3(position.x, position.y);
                node.parent = (this.gameMap as any).node;
                node.getComponent(constructor)?.init(`door${id}`, callback);
            }
        }
    }

    private disappearEventCollision(eventInfo: any, tileIndex: number) {
        let existCondition = eventInfo.condition[0];
        if (existCondition) {
            let index = existCondition.indexOf(tileIndex);
            if (index != -1) {
                eventInfo.condition[0] = null;
            } else {
                let disappearCondition: number[] = eventInfo.condition[1];
                index = disappearCondition.indexOf(tileIndex);
                if (index != -1) {
                    disappearCondition.splice(index, 1);
                    if (disappearCondition.length == 0) {
                        GameApp.CommandManager.createCommand(EventCollisionCommand).execute(eventInfo.value);
                    }
                }
            }
        }
    }

    /**
     * 墙门出现事件
     * @param eventInfo 事件数据
     * @param tile 事件发生的地块位置
     */
    private appearEventCollision(eventInfo: any, tile: IVec2) {
        this.createDoorAnimation(DoorType.WALL, tile, false, () => {
            this.gameMap.setTileGIDAt("door", tile, this.gameMap.getGidByName(`door${DoorType.WALL}`));
        });

        let condition: number[] = eventInfo.condition;
        let index = condition.indexOf(this.gameMap.getTileIndex(tile));
        if (index != -1) {
            condition.splice(index, 1);
        }
        this.levelData.saveMapData();
        if (condition.length == 0) {
            GameApp.CommandManager.createCommand(EventCollisionCommand).execute(eventInfo.value);
        }
    }
}