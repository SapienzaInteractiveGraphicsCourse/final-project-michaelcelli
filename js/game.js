class Game {

    constructor(scene, camera, difficulty) {
        //initialize variables
        this.animation = false;

        this.astronautHealth = 100;
        this.score = 0;
        this.difficulty = difficulty;

        this.showAstronautHealth = document.getElementById('health')
        this.showScore = document.getElementById('score')
        this.muteButton = document.getElementById('audioMute_image');
        this.unMuteButton = document.getElementById('audio_image');
        this.scoreBoard = document.getElementById('scoreboard');
        this.gameOverText = document.getElementById('gameover');

        this.gameOver = false;

        this.time = 0;
        this.clock = new THREE.Clock();
        this.noActions = new THREE.Clock();

        this.marsInitialized = false;
        this.astronautInitialized = false;
        this.roverInitialized = false;
        this.meteoriteInitialized = false;
        this.canRespawn = false;
        this.respawnTime = 10;

        this.previousCollider;

        this.wheelsAnimation = false;
        this.wheelsRotation = false;

        this.meteorites = new Array();

        this._setMarsRotationSpeed();

        this.muted = false;
        this._setUpSounds();

        //prepare 3d scene
        this._initializeScene();
        this.startAnimation(scene, camera);

        //bind event caalbacks
        document.addEventListener('keydown', this._keydown.bind(this));
        document.addEventListener('keyup', this._keyup.bind(this));
        this.muteButton.onclick = () => {
            this._mute();
        }
        this.unMuteButton.onclick = () => {
            this._unMute();
        }
    }

    update(scene, camera) {
        //recompute the game state
        if (this.animation) {
            var count = 0;
            this.starsBox.vertices.forEach(star => {
                star.velocity += star.acceleration;
                star.y -= star.velocity;
                if (star.y < -200) {
                    count++;
                }
            })
            this.starsBox.verticesNeedUpdate = true; 
            this.stars.rotation.y += 0.002;
            if (count == 6000) {
                this.animation = false;
                scene.remove(this.stars);
                this.populateScene(scene, camera);
            }
        }
        else {
            if (this.marsInitialized && this.astronautInitialized && this.roverInitialized && this.meteoriteInitialized) {
                this.earthMesh.rotateY(0.005);
                this.mercuryMesh.rotateY(0.005);
                TWEEN.update();
                this.time += this.clock.getDelta();
                this.mars.rotation.x += this.marsRotationSpeed;
                if (this.noActions.getElapsedTime() > (this.respawnTime - this.difficulty) && this.canRespawn) {
                    this.canRespawn = false;
                    this.meteorites.length = 0;
                    this.obstaclesArray.length = 0;
                    this.mars.remove(this.objectsParent);
                    this.objectsParent = new THREE.Group();
                    this._spawnMeteorites(this.meteorite);
                    this.mars.attach(this.objectsParent);
                }
                if ((this.time % 5).toFixed(2) == 0.00) { //increment rotation speed after 10 seconds
                    this.marsRotationSpeed += 0.0002;
                }
                if (this.wheelsAnimation && !this.wheelsRotation) {
                    this.wheelsAnimation = false;
                    this._resetWheelsRotations();
                }
                this._updateMeteoritesBox();
                this._runRoverWheels();
                this._checkCollisions();
                this._updateInfoPanel();
                this._checkGameOver(scene);
            }
        }
    }

    _setUpSounds() {
        this.bg = new Audio('../audio/music_background.wav');
        this.bg.volume = 0.6;
        this.bg.loop = true;
        this.exp = new Audio('../audio/explosion_player.wav');
        this.exp.volume = 0.3;
        this.go = new Audio('../audio/game_over.mp3');
        this.go.volume = 0.6;
    }

    _createAstronautCollider(astronaut) {
        const geometry = new THREE.BoxGeometry(3, 7)
        geometry.computeBoundingBox()
        const material = new THREE.MeshPhongMaterial({
            visible: false
        })
        this.astronautCollider = new THREE.Mesh(geometry, material)
        this.astronautCollider.position.set(astronaut.position.x, astronaut.position.y + 4.2, astronaut.position.z)
        this.astronautBox = new THREE.Box3().setFromObject(this.astronautCollider);
    }

    _createMeteoritesColliders(direction, obj) {
        if (direction == "horizontal") {
            const hGeometry = new THREE.BoxGeometry(1, 1)
            const hMaterial = new THREE.MeshPhongMaterial({
                visible: false
            })
            this.horizontalMeteoriteCollider = new THREE.Mesh(hGeometry, hMaterial);
            this.horizontalMeteoriteCollider.position.copy(obj.position);
        }

        else { //vertical box
            const vGeometry = new THREE.BoxGeometry(1, 1)
            const vMaterial = new THREE.MeshPhongMaterial({
                visible: false
            })
            this.verticalMeteoriteCollider = new THREE.Mesh(vGeometry, vMaterial);
            this.verticalMeteoriteCollider.position.copy(obj.position);
        }
    }

    _updateMeteoritesBox() {
        if (this.meteorites.length > 0) {
            this.meteoriteBox1.setFromObject(this.meteorites[0]);
            this.meteoriteBox2.setFromObject(this.meteorites[1]);
            this.meteoriteBox3.setFromObject(this.meteorites[2]);
            this.meteoriteBox4.setFromObject(this.meteorites[3]);
        }
    }

    _setMarsRotationSpeed() {
        if (this.difficulty == 0)
            this.marsRotationSpeed = 0.001;
        else if (this.difficulty == 2)
            this.marsRotationSpeed = 0.002;
        else if (this.difficulty == 4)
            this.marsRotationSpeed = 0.0025;
    }

    _playBackgroundMusic() {
        this.bg.play();
    }

    _playExplosionMusic() {
        this.exp.play();
    }

    _playGameOver() {
        this.go.play();
    }

    _mute() {
        this.muted = true;
        this.bg.volume = 0.0;
        this.exp.volume = 0.0;
        this.go.volume = 0.0;
        this.muteButton.style.visibility = "hidden";
        this.unMuteButton.style.visibility = "visible";
    }

    _unMute() {
        this.muted = false;
        this.bg.volume = 0.6;
        this.exp.volume = 0.3;
        this.go.volume = 0.6;
        this.muteButton.style.visibility = "visible";
        this.unMuteButton.style.visibility = "hidden";
    }

    _keyup() {
        if (this.wheelsAnimation && this.wheelsRotation) {
            this.wheelsRotation = false;
        }
        this.noActions.start();
        this.canRespawn = true;
    }

    _keydown(event) {
        this.noActions.stop();
        this.canRespawn = false;

        //check for the key to move the character accordingly
        switch (event.keyCode) {
            case 32: //space
                if (this.astronaut.position.y < 21.5) {
                    this._astronautJump();
                }
                break;
            case 39: //right arrow
                if (this.astronaut.position.x <= 6) {
                    this._moveAstronautRight();
                }
                if (this.rover.position.x <= 9) {
                    this._moveRoverRight();
                    if (!this.wheelsAnimation)
                        this._turnWheelsRight();
                }
                break;
            case 37: //left arrow
                if (this.astronaut.position.x >= -3) {
                    this._moveAstronautLeft();
                }
                if (this.rover.position.x >= 0) {
                    this._moveRoverLeft();
                    if (!this.wheelsAnimation)
                        this._turnWheelsLeft();
                }
                break;
        }
    }

    _checkCollisions() {
        //obstacles
        this.obstaclesArray.forEach(element => {
            if (this.astronautBox.intersectsBox(element) && element != this.previousCollider) {
                this.previousCollider = element;
                if (element.userData.type === 'meteorite') {
                    !this.muted ? this._playExplosionMusic() : null
                    this.astronautHealth -= 10;
                }
            }
        })
    }

    _updateInfoPanel() {
        this.showScore.innerHTML = "Score: " + this.score;
        this.showAstronautHealth.innerHTML = "Astronaut Health: " + this.astronautHealth;
    }

    _checkGameOver(scene) {
        if (this.astronautHealth == 0 && !this.gameOver) {
            this.gameOver = true;
            this._gameOver(scene);
        }
    }

    _gameOver(scene) {
        //prepare end state
        //show ui
        TWEEN.removeAll();
        this.bg.pause();
        this._playGameOver();
        this.marsRotationSpeed = 0.0;
        scene.remove(this.astronaut);
        scene.remove(this.rover);
        this.mars.remove(this.objectsParent);
        this.obstaclesArray.length = 0;
        this._showGameOverPanel();
        setTimeout(() => {
            location.reload();
            return false;
        }, 6000);
    }

    _showGameOverPanel() {
        this.gameOverText.innerHTML = "GAME OVER";
    }

    startAnimation(scene, camera) {
        this.animation = true;
        camera.position.z = 1;
        camera.rotation.x = Math.PI / 2;
        this.starsBox = new THREE.Geometry();
        this.vertices = [];
        for (let i = 0; i < 6000; i++) {
            let star = new THREE.Vector3(
                Math.random() * 600 - 300,
                Math.random() * 600 - 300,
                Math.random() * 600 - 300
            );
            star.velocity = 0;
            star.acceleration = 0.02;
            this.starsBox.vertices.push(star);
        }

        let starImage = new THREE.TextureLoader().load('images/star.png');
        let starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            map: starImage
        });

        this.stars = new THREE.Points(this.starsBox, starMaterial);
        scene.add(this.stars);
    };

    populateScene(scene, camera) {
        scene.add(this.mars);
        scene.add(this.astronaut);
        scene.add(this.rover);
        scene.add(this.mercuryMesh);
        scene.add(this.earthMesh);
        this.astronaut.attach(this.astronautCollider);
        camera.rotation.x = 0;
        camera.position.x = 1.5;
        camera.position.z = 59;
        camera.position.y = 40;
        scene.background = this.starsBackground;
        scene.add(this.light);
        scene.add(this.lightAmbient);
        this.marsInitialized = true;
        this.astronautInitialized = true;
        this.roverInitialized = true;
        this.meteoriteInitialized = true;
        this.scoreBoard.style.visibility = "visible";
        this.muteButton.style.visibility = "visible";
        this._startAstronautRunning();
        this._roverCameraScan();
        this._playBackgroundMusic();
        this._spawnMeteorites(this.meteorite);
    }

    _startAstronautRunning() {
        this.run = new TWEEN.Tween({ _rl: this.rightLeg.rotation.z, _ll: this.leftLeg.rotation.z, _lk: this.leftKnee.rotation.z, _rk: this.rightKnee.rotation.z, _lt: this.leftToe.rotation.z, _rt: this.rightToe.rotation.z, _la: this.leftArm, _ra: this.rightArm, _rh: this.rightHand.rotation.x, _lh: this.leftHand.rotation.x, _rey: this.rightElbow.rotation.y, _ley: this.leftElbow.rotation.y, _rez: this.rightElbow.rotation.z, _lez: this.leftElbow.rotation.z, _rcz: this.rightClevicle.rotation.z, _rcy: this.rightClevicle.rotation.y, _lcy: this.leftClevicle.rotation.y, _lcz: this.leftClevicle.rotation.z })
            .to({
                _ll: this.leftLeg.rotation.z - 1.1,
                _rl: this.rightLeg.rotation.z + 1.1,
                _lk: this.leftKnee.rotation.z - 1.0,
                _rk: this.rightKnee.rotation.z + 1.0,
                _lt: this.leftToe.rotation.z + 0.15,
                _rt: this.rightToe.rotation.z - 0.15,
                _lh: this.leftHand.rotation.x - 0.5,
                _rh: this.rightHand.rotation.x - 0.5,
                _ley: this.leftElbow.rotation.y - 0.2,
                _lez: this.leftElbow.rotation.z + 0.2,
                _rey: this.rightElbow.rotation.y + 0.2,
                _rez: this.rightElbow.rotation.z - 0.2,
                _lcz: this.leftClevicle.rotation.z + 0.8,
                _lcy: this.leftClevicle.rotation.y - 0.8,
                _rcy: this.rightClevicle.rotation.y + 0.8,
                _rcz: this.rightClevicle.rotation.z - 0.8
            }, 1000)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.leftLeg.rotation.z = element._ll;
                this.rightLeg.rotation.z = element._rl;
                this.leftKnee.rotation.z = element._lk;
                this.rightKnee.rotation.z = element._rk;
                this.leftToe.rotation.z = element._lt;
                this.rightToe.rotation.z = element._rt;
                this.leftHand.rotation.x = element._lh;
                this.rightHand.rotation.x = element._rh;
                this.leftElbow.rotation.y = element._ley;
                this.rightElbow.rotation.y = element._rey;
                this.leftElbow.rotation.z = element._lez;
                this.rightElbow.rotation.z = element._rez;
                this.leftClevicle.rotation.z = element._lcz;
                this.leftClevicle.rotation.y = element._lcy;
                this.rightClevicle.rotation.z = element._rcz;
                this.rightClevicle.rotation.y = element._rcy;
            })
            .onRepeat(() => {
                this.score += 1;
            })
            .repeat(Infinity) // repeats
            .yoyo(true)
            .start()
    };

    _astronautJump() {
        this.jump = new TWEEN.Tween({ ap: this.astronaut.position.y, _rl: this.rightLeg.rotation.z, _ll: this.leftLeg.rotation.z, _lk: this.leftKnee.rotation.z, _rk: this.rightKnee.rotation.z, _lt: this.leftToe.rotation.z, _rt: this.rightToe.rotation.z, _la: this.leftArm, _ra: this.rightArm, _rh: this.rightHand.rotation.x, _lh: this.leftHand.rotation.x, _rey: this.rightElbow.rotation.y, _ley: this.leftElbow.rotation.y, _rez: this.rightElbow.rotation.z, _lez: this.leftElbow.rotation.z, _rcz: this.rightClevicle.rotation.z, _rcy: this.rightClevicle.rotation.y, _lcy: this.leftClevicle.rotation.y, _lcz: this.leftClevicle.rotation.z })
            .to({
                ap: this.astronaut.position.y + 6.0,
                _lcz: this.leftClevicle.rotation.z + 0.8,
                _rcz: this.rightClevicle.rotation.z + 0.8,
            }, 500)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.astronaut.position.y = element.ap;
                this.leftClevicle.rotation.z = element._lcz;
                this.rightClevicle.rotation.z = element._rcz;
                this.astronautBox.setFromObject(this.astronautCollider);
            })
            .repeat(1)
            .yoyo(true)
            .start()
    }

    _moveAstronautLeft() {
        this.turnLeft = new TWEEN.Tween({ ap: this.astronaut.position.x })
            .to({
                ap: this.astronaut.position.x - 0.4
            }, 200)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.astronaut.position.x = element.ap;
                this.astronautBox.setFromObject(this.astronautCollider);
            })
            .start()
    }

    _moveAstronautRight() {
        this.turnRight = new TWEEN.Tween({ ap: this.astronaut.position.x })
            .to({
                ap: this.astronaut.position.x + 0.4
            }, 200)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.astronaut.position.x = element.ap;
                this.astronautBox.setFromObject(this.astronautCollider);
            })
            .start()
    }

    _runRoverWheels() {
        this.rightBackWheel.rotation.z += 0.2;
        this.rightCenterWheel.rotation.z += 0.2;
        this.rightFrontWheel.rotation.z += 0.2;
        this.leftBackWheel.rotation.z += 0.2;
        this.leftCenterWheel.rotation.z += 0.2;
        this.leftFrontWheel.rotation.z += 0.2;
    }

    _moveRoverRight() {
        this.moveRight = new TWEEN.Tween({ rpx: this.rover.position.x, rpy: this.rover.position.y })
            .to({
                rpx: this.rover.position.x + 0.4,
                rpy: this.rover.position.x <= 6.5 ? null : (this.rover.position.x <= 8.0 ? 20.95 : 20.8),
            }, 200)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.rover.position.x = element.rpx
                this.rover.position.y = element.rpy
            })
            .start()
    }

    _moveRoverLeft() {
        this.moveLeft = new TWEEN.Tween({ rp: this.rover.position.x, rpy: this.rover.position.y })
            .to({
                rp: this.rover.position.x - 0.4,
                rpy: (this.rover.position.x <= 8.0 && this.rover.position.x >= 6.5) ? 20.95 : (this.rover.position.x <= 6.5 ? 21.2 : null),
            }, 200)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.rover.position.x = element.rp
                this.rover.position.y = element.rpy
            })
            .start()
    }

    _turnWheelsLeft() {
        this.turnLeft = new TWEEN.Tween({ rb: this.rightBackWheel.rotation.y, rc: this.rightCenterWheel.rotation.y, rf: this.rightFrontWheel.rotation.y, lb: this.leftBackWheel.rotation.y, lc: this.leftCenterWheel.rotation.y, lf: this.leftFrontWheel.rotation.y })
            .to({
                rb: this.rightBackWheel.rotation.y - 0.4,
                rc: this.rightCenterWheel.rotation.y + 0.3,
                rf: this.rightFrontWheel.rotation.y + 0.4,
                lb: this.leftBackWheel.rotation.y + 0.4,
                lc: this.leftCenterWheel.rotation.y - 0.3,
                lf: this.leftFrontWheel.rotation.y + 0.4
            }, 100)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.wheelsRotation = true;
                this.rightBackWheel.rotation.y = element.rb
                this.rightCenterWheel.rotation.y = element.rc
                this.rightFrontWheel.rotation.y = element.rf
                this.leftBackWheel.rotation.y = element.lb
                this.leftCenterWheel.rotation.y = element.lc
                this.leftFrontWheel.rotation.y = element.lf
            })
            .onStart(() => {
                this.wheelsAnimation = true;
            })
            .start()
    }

    _turnWheelsRight() {
        this.turnRight = new TWEEN.Tween({ rb: this.rightBackWheel.rotation.y, rc: this.rightCenterWheel.rotation.y, rf: this.rightFrontWheel.rotation.y, lb: this.leftBackWheel.rotation.y, lc: this.leftCenterWheel.rotation.y, lf: this.leftFrontWheel.rotation.y })
            .to({
                rb: this.rightBackWheel.rotation.y + 0.4,
                rc: this.rightCenterWheel.rotation.y - 0.3,
                rf: this.rightFrontWheel.rotation.y - 0.4,
                lb: this.leftBackWheel.rotation.y - 0.4,
                lc: this.leftCenterWheel.rotation.y + 0.3,
                lf: this.leftFrontWheel.rotation.y - 0.4
            }, 100)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.wheelsRotation = true;
                this.rightBackWheel.rotation.y = element.rb
                this.rightCenterWheel.rotation.y = element.rc
                this.rightFrontWheel.rotation.y = element.rf
                this.leftBackWheel.rotation.y = element.lb
                this.leftCenterWheel.rotation.y = element.lc
                this.leftFrontWheel.rotation.y = element.lf
            })
            .onStart(() => {
                this.wheelsAnimation = true;
            })
            .start()
    }

    _resetWheelsRotations() {
        this.rightBackWheel.rotation.y = 0
        this.rightCenterWheel.rotation.y = 0
        this.rightFrontWheel.rotation.y = 0
        this.leftBackWheel.rotation.y = 0
        this.leftCenterWheel.rotation.y = 0
        this.leftFrontWheel.rotation.y = 0
    }

    _roverCameraScan() {
        this.scan = new TWEEN.Tween({ camera: this.roverCamera.rotation.y })
            .to({
                camera: this.roverCamera.rotation.y + 2 * Math.PI
            }, 8000)
            .easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth
            .onUpdate((element) => {
                this.roverCamera.rotation.y = element.camera;
            })
            .repeat(Infinity) // repeats
            .yoyo(true)
            .start()
    }

    _initializeScene() {

        //3d models
        this.loader = new THREE.GLTFLoader();
        const dracoLoader = new THREE.DRACOLoader();
        this.loader.setDRACOLoader(dracoLoader);

        this.objectsParent = new THREE.Group();
        this.obstaclesArray = new Array();

        this.mars = this.gltfModelLoad('../models/mars/scene.gltf', true, false);
        Promise.resolve(this.mars).then((data) => {
            this.mars = data;
            this.mars.scale.set(45, 45, 45);
            this.mars.rotateX(-45 * Math.PI / 180);
            this.mars.position.y = -90;
            this.mars.position.z = 15;
            this.mars.attach(this.objectsParent);
        });

        this.astronaut = this.gltfModelLoad('../models/astronaut/scene.gltf', true, true);
        Promise.resolve(this.astronaut).then((data) => {
            this.astronaut = data;
            this.spine = this.astronaut.getObjectByName("Spine_16_9");
            this.spine.rotation.x -= 5.8;
            this.rightLeg = this.astronaut.getObjectByName("R_Thigh88_91");
            this.rightLeg.rotation.z -= 0.3;
            this.leftLeg = this.astronaut.getObjectByName("L_Thigh82_85");
            this.leftLeg.rotation.z += 0.8;
            this.leftKnee = this.astronaut.getObjectByName("L_Knee83_86");
            this.leftKnee.rotation.z -= 0.6;
            this.rightKnee = this.astronaut.getObjectByName("R_Knee89_92");
            this.rightKnee.rotation.z -= 1.6;
            this.leftToe = this.astronaut.getObjectByName("L_Ankle84_87");
            this.leftToe.rotation.z -= 0.15;
            this.rightToe = this.astronaut.getObjectByName("R_Ankle90_93");
            this.rightArm = this.astronaut.getObjectByName("R_Arm44_47");
            this.leftArm = this.astronaut.getObjectByName("L_Arm10_13");
            this.rightHand = this.astronaut.getObjectByName("R_Wrist46_49");
            this.rightHand.rotation.x += 0.5;
            this.leftHand = this.astronaut.getObjectByName("L_Wrist12_15");
            this.rightElbow = this.astronaut.getObjectByName("R_Elbow45_48");
            this.rightElbow.rotation.y += 1.0;
            this.leftElbow = this.astronaut.getObjectByName("L_Elbow11_14");
            this.leftElbow.rotation.y -= 1.2;
            this.leftElbow.rotation.z -= 0.2;
            this.leftClevicle = this.astronaut.getObjectByName("L_Clevicle9_12");
            this.leftClevicle.rotation.z -= 0.8
            this.rightClevicle = this.astronaut.getObjectByName("R_Clevicle43_46");
            this.rightClevicle.rotation.y -= 0.8;
            this.astronaut.scale.set(2.5, 2.5, 2.5);
            this.astronaut.rotateY(190 * Math.PI / 180);
            this.astronaut.rotateX(-8 * Math.PI / 180);
            this.astronaut.position.y = 21.3;
            this.astronaut.position.x = 1.5;
            this.astronaut.position.z = 30;
            this._createAstronautCollider(this.astronaut);
        });

        this.rover = this.gltfModelLoad('../models/rover/scene.gltf', true, true);
        Promise.resolve(this.rover).then((data) => {
            this.rover = data;
            this.rightBackWheel = this.rover.getObjectByName("LeftMechanicalArmFrontWell004_23");
            this.rightCenterWheel = this.rover.getObjectByName("LeftMechanicalArmFrontWell003_25");
            this.rightFrontWheel = this.rover.getObjectByName("RightMechanicalArmFrontWell_27");
            this.leftBackWheel = this.rover.getObjectByName("LeftMechanicalArmFrontWell002_15");
            this.leftCenterWheel = this.rover.getObjectByName("LeftMechanicalArmFrontWell001_17");
            this.leftFrontWheel = this.rover.getObjectByName("LeftMechanicalArmFrontWell_19");
            this.roverCamera = this.rover.getObjectByName("keycamtower_8");
            this.rover.position.y = 21.2
            this.rover.position.z = 30
            this.rover.position.x = 4.5
            this.rover.scale.set(0.3, 0.3, 0.3);
            this.rover.rotateY(90 * Math.PI / 180);
            this.rover.rotateZ(8 * Math.PI / 180);
        });

        this.meteorite = this.gltfModelLoad('../models/island_meteorite/scene.gltf', true, true);
        Promise.resolve(this.meteorite).then((data) => {
            this.meteorite = data;
            this.meteorite.scale.set(0.02, 0.03, 0.04);
            this.meteorite.rotateY(90 * Math.PI / 180);
            this.meteorite.rotateX(90 * Math.PI / 180);
        });

        const mercuryGeometry = new THREE.SphereGeometry(5, 100, 100);
        const mercuryMaterial = new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load("../images/mercurymap.jpg"),
            bumpMap: new THREE.TextureLoader().load("../images/mercurybump.jpg"),
            bumpScale: 0.015
        });
        this.mercuryMesh = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
        this.mercuryMesh.position.z = -100;
        this.mercuryMesh.position.y = 60;

        const earthGeometry = new THREE.SphereGeometry(5, 100, 100);
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load("../images/earth.jpeg"),
            normalMap: new THREE.TextureLoader().load("../images/earth_normalmap.jpg"),
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earthMesh.position.z = -80;
        this.earthMesh.position.y = 60;
        this.earthMesh.position.x = 150;
        this.earthMesh.material.needsUpdate = true;

        //Directional light
        this.light = new THREE.DirectionalLight(0xffffff, 3.5);
        this.light.castShadow = true;
        this.light.position.set(0, 500, -100);
        this.light.shadow.camera.top += 50
        this.light.shadow.camera.right += 30
        this.light.shadow.camera.left -= 30
        this.light.shadow.camera.bottom -= 50
        this.light.shadow.mapSize.width = 4096;
        this.light.shadow.mapSize.height = 4096;

        //Ambient light
        this.lightAmbient = new THREE.AmbientLight(0xffffff, 1); // white light

        this.starsBackground = new THREE.TextureLoader().load("../images/stars_milky_way.jpeg");
    }

    gltfModelLoad(gltfFile, receive, cast) {
        const myPromise = new Promise((resolve, reject) => {
            this.loader.load(
                gltfFile,
                function (gltf) {
                    gltf.scene.traverse(function (child) {
                        if (child.isMesh) {
                            child.receiveShadow = receive;
                            child.castShadow = cast;
                        }
                    })
                    resolve(gltf.scene);
                },
                function (xhr) {
                    // console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
                },
                function (error) {
                    // console.log("An error happened");
                    reject(error);
                }
            )
        })
        return myPromise;

    }

    _spawnMeteorites(meteorite) {
        var positionZ = 0;
        var positionY = 22;
        for (let i = 0; i < 4; i++) {
            var obj = meteorite.clone();
            if (Math.random() < 0.3)
                obj.rotateX(-90 * Math.PI / 180);
            else if (Math.random() > 0.6)
                obj.rotateY(-90 * Math.PI / 180);
            if (i == 0) {
                obj.position.set(this._random(0.5, 8.5) - 3.0, positionY, positionZ);
                if (obj.rotation.x < 0 || obj.rotation.x > 0) {
                    this._createMeteoritesColliders("horizontal", obj)
                    this.meteoriteBox1 = new THREE.Box3().setFromObject(this.horizontalMeteoriteCollider);
                    obj.attach(this.horizontalMeteoriteCollider)
                }
                else { //x rotation 0
                    this._createMeteoritesColliders("vertical", obj)
                    this.meteoriteBox1 = new THREE.Box3().setFromObject(this.verticalMeteoriteCollider);
                    obj.attach(this.verticalMeteoriteCollider)
                }
                this.meteoriteBox1.userData = { type: 'meteorite' };
            }
            else if (i == 1) {
                obj.position.set(this._random(0.5, 8.5) - 3.0, positionY - 6, positionZ);
                if (obj.rotation.x < 0 || obj.rotation.x > 0) {
                    this._createMeteoritesColliders("horizontal", obj)
                    this.meteoriteBox2 = new THREE.Box3().setFromObject(this.horizontalMeteoriteCollider);  
                    obj.attach(this.horizontalMeteoriteCollider)
                }
                else { //x rotation 0
                    this._createMeteoritesColliders("vertical", obj)
                    this.meteoriteBox2 = new THREE.Box3().setFromObject(this.verticalMeteoriteCollider);
                    obj.attach(this.verticalMeteoriteCollider)
                }
                this.meteoriteBox2.userData = { type: 'meteorite' };
            }
            else if (i == 2) {
                obj.position.set(this._random(0.5, 8.5) - 3.0, positionY - 19, positionZ);
                if (obj.rotation.x < 0 || obj.rotation.x > 0) {
                    this._createMeteoritesColliders("horizontal", obj)
                    this.meteoriteBox3 = new THREE.Box3().setFromObject(this.horizontalMeteoriteCollider);
                    obj.attach(this.horizontalMeteoriteCollider)
                }
                else { //x rotation 0
                    this._createMeteoritesColliders("vertical", obj)
                    this.meteoriteBox3 = new THREE.Box3().setFromObject(this.verticalMeteoriteCollider);
                    obj.attach(this.verticalMeteoriteCollider)
                }
                this.meteoriteBox3.userData = { type: 'meteorite' };
            }
            else if (i == 3) {
                obj.position.set(this._random(0.5, 8.5) - 3.0, positionY - 42, positionZ);
                if (obj.rotation.x < 0 || obj.rotation.x > 0) {
                    this._createMeteoritesColliders("horizontal", obj)
                    this.meteoriteBox4 = new THREE.Box3().setFromObject(this.horizontalMeteoriteCollider);
                    obj.attach(this.horizontalMeteoriteCollider)
                }
                else { //x rotation 0
                    this._createMeteoritesColliders("vertical", obj)
                    this.meteoriteBox4 = new THREE.Box3().setFromObject(this.verticalMeteoriteCollider);
                    obj.attach(this.verticalMeteoriteCollider)
                }
                this.meteoriteBox4.userData = { type: 'meteorite' };
            }
            this.meteorites[i] = obj; 
            positionZ -= 25;
        }
        this.obstaclesArray.push(this.meteoriteBox1);
        this.obstaclesArray.push(this.meteoriteBox2);
        this.obstaclesArray.push(this.meteoriteBox3);
        this.obstaclesArray.push(this.meteoriteBox4);
        this.meteorites.forEach(element => {
            this.objectsParent.add(element);
        });
    }

    _random(min, max) {
        return Math.random() * (max - min) + min;
    }

}