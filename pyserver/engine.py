from math import pi, sin, cos

from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from panda3d.core import CollisionTraverser
from panda3d.core import CollisionHandlerPusher
from panda3d.core import CollisionNode

from pandac.PandaModules import loadPrcFileData 


#https://arsthaumaturgis.github.io/Panda3DTutorial.io/tutorial/tut_lesson06.html
class Engine(ShowBase):
    def __init__(self, headless):
        if headless:
           loadPrcFileData("", "window-type none") 

        ShowBase.__init__(self)

        self.cTrav = CollisionTraverser()
        self.pusher = CollisionHandlerPusher()

        self.render.setShaderAuto()

        self.scene = self.loader.loadModel("models/environment")
        self.scene.reparentTo(self.render)
        self.scene.setScale(0.25, 0.25, 0.25)
        self.scene.setPos(-8, 42, 0)
        
        self.taskMgr.add(self.update, 'update')    

        self.movingObjects = []
        self.staticObjects = []

        print('Engine initialized')


    def update(self, task):
        for i in self.movingObjects:
            i.update()
        for i in self.staticObjects:
            i.update()

        return Task.cont

    def cameraTask(self, task):
        angleDegrees = task.time * 6.0
        angleRadians = angleDegrees * (pi / 180.0)
        self.camera.setPos(20 * sin(angleRadians), -20.0 * cos(angleRadians), 3)
        self.camera.setHpr(angleDegrees, 0, 0)
        return Task.cont

    def addCollider(self, name, parent, collisionObject): #collisionObject example: CollisionSphere(0, 0, 0, 0.3), parent can be the scene, or the object created
        colliderNode = CollisionNode(name)
        colliderNode.addSolid(collisionObject)
        collider = parent.attachNewNode(colliderNode)
        self.pusher.addCollider(collider, parent)
        self.cTrav.addCollider(collider, self.pusher)
        return collider