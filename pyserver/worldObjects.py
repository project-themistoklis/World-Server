from panda3d.core import Vec3, Vec2
from direct.actor.Actor import Actor
from panda3d.core import CollisionSphere, CollisionNode

class GameObject():
    def __init__(self, pos, modelName, isStatic, engine, name, collisionObject):
        self.actor = Actor(modelName)
        self.actor.reparentTo(engine.render)
        self.actor.setPos(pos)

        self.isStatic = isStatic

        self.collider = engine.addCollider(name, self.actor, collisionObject)
    
    def update(self):
        pass


class MovingObject(GameObject):
    def __init__(self, pos, modelName, engine, name, collisionObject):
        GameObject.__init__(self, pos, modelName, False, engine, name, collisionObject)
    
    def update(self):
        GameObject.update(self)

class StaticObject(GameObject):
    def __init__(self, pos, modelName, engine, name, collisionObject):
        GameObject.__init__(self, pos, modelName, True, engine, name, collisionObject)
    
    def update(self):
        GameObject.update(self)