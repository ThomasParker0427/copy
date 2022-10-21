import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
  OrbitControls,
  useProgress,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { BsLaptop } from "react-icons/bs";
import { GoDesktopDownload } from "react-icons/go";
const panel = new GUI({ width: 310 });

import { useSnapshot } from "valtio";
import snapState from "./snapState";

import FileDropzone from "./FileDropzone";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { GrClose } from "react-icons/gr";

const baseUrl = "http://localhost:3001/";
// const baseUrl = "http://10.10.10.88/api/";
// const baseUrl = "/";
const fileBasePath = baseUrl + "uploads/";
const defaultFileName = "dress 3 colors.glb";
// const defaultFileName = "470.glb";

const ClotheModel = (props) => {
  const { deviceType } = props;
  const importInputRef = useRef();
  const modelRef = useRef();
  const componentRef = useRef();

  const [glbScene, setGlbScene] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [materials, setMaterials] = useState(null);
  // const [otherNodes, setOtherNodes] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(defaultFileName);
  const [fileLoding, setFileLoding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  var texture2 = new THREE.Texture();

  const snap = useSnapshot(snapState);
  // const { progress } = useProgress();
  const onChange = (e) => {
    if(e.target.name === "offsetX") texture2.offset.x = e.target.value / 10;
    if(e.target.name === "offsetY") texture2.offset.y = e.target.value / 10;
    if(e.target.name === "repeatX") texture2.repeat.x = e.target.value / 10;
    if(e.target.name === "repeatY") texture2.repeat.y = e.target.value / 10;
  }

  // Update current state with changes from controls
  useEffect(() => {
    // const targetMaterial = panel.addFolder("Target Material");
    // targetMaterial.add(texture2.offset, "x", -4.0, 8.0, 0.01).name("offset x");
    // targetMaterial.add(texture2.offset, "y", -4.0, 8.0, 0.01).name("offset y");
    // targetMaterial.add(texture2.repeat, "x", 0.0, 8.0, 0.01).name("repeat x");
    // targetMaterial.add(texture2.repeat, "y", 0.0, 8.0, 0.01).name("repeat y");
    const tempNodes = [];
    nodes.forEach((element) => {
      if (element.material.name === snap.current) {
        tempNodes.push(element);
      }
    });
    renderMeshes(tempNodes);
  }, [texture2]);

  useEffect(() => {
    loadModel(defaultFileName);
  }, []);

  // useEffect(() => {
  //   if (file) {
  //     uploadToServer()
  //       .then((res) => {
  //         reloadModel(file.name);
  //       })
  //       .catch((err) => console.log(err));
  //   }
  // }, [file]);

  // const { nodes: pnodes, materials: pmaterials } = useGLTF(fileBasePath + defaultFileName);
  // console.log({ pnodes, pmaterials })

  const loadModel = (fname) => {
    if (fileLoding) return;

    const url = fileBasePath + fname;

    const manager = new THREE.LoadingManager();
    manager.onStart = function (url, itemsLoaded, itemsTotal) {
      setFileLoding(true);
      // console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    manager.onLoad = function () {
      console.log("Loading complete!");
      setFileLoding(false);
      setShowModal(false);
    };
    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
      // console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    manager.onError = function (url) {
      console.log("There was an error loading " + url);
    };

    try {
      const loader = new GLTFLoader(manager);
      loader.load(url, async (gltf) => {
        // const _nodes = await gltf.parser.getDependencies("node");
        // const _materials = await gltf.parser.getDependencies("material");
        // /* setOtherNodes(
        //   _nodes.filter((item) => item.type !== "Group" && item.type !== "Mesh")
        // ); */
        // console.log({ _nodes, _materials });
        // setNodes(filterNodes(_nodes));
        // setMaterials(_materials);
        const _nodes = await gltf.parser.getDependencies("node");
        const _materials = await gltf.parser.getDependencies("material");
        setNodes(filterNodes(_nodes));
        setMaterials(_materials);
        setGlbScene(gltf.scene);

        let meshes = [];
        let geoms = {};
        gltf.scene.traverse((e) => e.isMesh && meshes.push(e)); //console.log(e.name))
        meshes.forEach((mesh) => {
          geoms[mesh.geometry.uuid] = mesh.geometry;
        });
        for (let k in geoms) {
          let g = geoms[k];
          if (g.groups.length == 0) {
            g.addGroup(0, Infinity, 0);
            g.addGroup(0, Infinity, 1);
          }
        }
      });
    } catch (err) {
      console.log({ err });
    }

    /* const { nodes, materials } = useGLTF(url);
    setNodes(filterNodes(nodes));
    setMaterials(materials); */

    // try {
    //   const { nodes, materials } = await useGLTF(url);
    //   // console.log({ _nodes: nodes, _materials: materials, counts: Object.keys(nodes).length })
    //   setNodes(nodes);
    //   setMaterials(materials);
    // } catch (err) {
    //   setTimeout(() => {
    //     loadModel(fname);
    //   }, 200);
    // }
  };

  const filterNodes = (nodes) => {
    // const gorupNodes = [];
    // nodes
    //   .filter((n) => n.type === "Group")
    //   .forEach((item) =>
    //     item.children?.forEach((node) => {
    //       if (node.type === "Group") {
    //         node.children?.forEach(d => gorupNodes.push(d))
    //       } else gorupNodes.push(node)
    //     })
    //     // item.children?.forEach(node => gorupNodes.push(node))
    //   );
    // const meshNodes = nodes.filter((n) => n.type === "Mesh") || [];
    // return [...gorupNodes, ...meshNodes];
    const allNodes = getChildren(nodes, "type", "Mesh");
    return [...allNodes];
  };

  const getChildren = (nodes, key, value) => {
    const array = [];
    get(nodes, key, value);
    function get(_nodes, _key, _value) {
      _nodes.forEach((node) => {
        if (node.children?.length > 0) get(node.children, _key, _value);
        else if (node[key] === _value) {
          array.push(node);
        }
      });
    }
    return array;
  };

  const getAllObjects = (nodes) => {
    const array = [];
    get(nodes);
    function get(_nodes) {
      _nodes.forEach((node) => {
        if (node.children?.length > 0) get(node.children);
        /* else if (node[key] === _value) {
          array.push(node)
        } */
      });
    }
    return array;
  };

  const importFile = (files) => {
    if (files[0]) {
      // setFile(files[0]);
      uploadToServer(files[0])
        .then((res) => {
          reloadModel(files[0].name);
        })
        .catch((err) => console.log(err));
    }
  };

  const reloadModel = (fname) => {
    snapState.current = null;
    snapState.items = {};
    snapState.textures = {};
    loadModel(fname);
    setFileName(fname);
  };

  const uploadToServer = async (file) => {
    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(baseUrl + "api/file", {
      method: "POST",
      body,
    });
    setIsUploading(false);
    return response;
  };

  const exportFile = () => {
    const exporter = new GLTFExporter();
    const params = {
      trs: false,
      onlyVisible: true,
      truncateDrawRange: true,
      binary: true,
      maxTextureSize: 4096,
    };
    const options = {
      trs: params.trs,
      onlyVisible: params.onlyVisible,
      truncateDrawRange: params.truncateDrawRange,
      binary: params.binary,
      maxTextureSize: params.maxTextureSize,
    };

    const scenes = modelRef.current.children;

    exporter.parse(
      scenes,
      function (result) {
        let fname = fileName;
        fname = fname.replace(".glb", "");
        fname = fname.replace(".gltf", "");
        if (result instanceof ArrayBuffer) {
          saveArrayBuffer(result, `${fname}.glb`);
        } else {
          const output = JSON.stringify(result, null, 2);
          saveString(output, `${fname}.gltf`);
        }
      },
      function (error) {
        console.log("An error happened during parsing", error);
      },
      options
    );
  };

  function save(blob, filename) {
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    // URL.revokeObjectURL( url ); breaks Firefox...
  }

  function saveString(text, filename) {
    save(new Blob([text], { type: "text/plain" }), filename);
  }

  function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: "application/octet-stream" }), filename);
  }

  const loadCursor = (materialName) => {
    const cursor = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${snap.items[materialName]}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="white-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${materialName}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`;
    const auto = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/></svg>`;
    document.getElementById(
      "canvas-content"
    ).style.cursor = `url('data:image/svg+xml;base64,${btoa(
      materialName ? cursor : auto
    )}'), auto`;
  };

  const getTexture1 = (materialName) => {
    // const texture = new THREE.TextureLoader().load("textures/texture.png")
    if (!snap.BackgroundTexture[materialName]) return null;
    const backgroundImage = new Image();
    backgroundImage.src = snap.BackgroundTexture[materialName];

    backgroundImage.onload = function () {
      texture1.needsUpdate = true;
    };

    texture1.image = backgroundImage;
    texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
    texture1.offset.set(+1.2, -2.38);
    texture1.repeat.set(3, 4);
    texture1.anisotropy = 12;
    texture1.encoding = THREE.sRGBEncoding;
    texture1.flipY = false;

    // const oMaterial = materials[materialName]
    const material = new THREE.MeshBasicMaterial({
      name: materialName,
      map: texture1,
      side: THREE.DoubleSide,
    });
    return material;
  };
  const getTexture2 = (materialName) => {
    if (!snap.TargetTexture[materialName]) return null;
    const targetImage = new Image();
    targetImage.src = snap.TargetTexture[materialName];
    targetImage.onload = function () {
      texture2.needsUpdate = true;
    };
    texture2.image = targetImage;
    texture2.wrapS = texture2.wrapT = THREE.ClampToEdgeWrapping;
    texture2.offset.set(+1.2, -2.38);
    texture2.repeat.set(-3, -4);
    texture2.anisotropy = 12;
    texture2.encoding = THREE.sRGBEncoding;
    texture2.flipY = false;

    // const oMaterial = materials[materialName]
    const material = new THREE.MeshBasicMaterial({
      name: materialName,
      map: texture2,
      side: THREE.DoubleSide,
    });
    return material;
  };

  const getWhiteTexture = () => {
    const image = new Image();
    image.src = "white.png";

    const texture = new THREE.Texture();
    image.onload = function () {
      texture.needsUpdate = true;
    };

    texture.image = image;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.offset.set(+0.2, +0.0);
    texture.repeat.set(5, 5);
    texture.anisotropy = 12;
    texture.encoding = THREE.sRGBEncoding;

    // const oMaterial = materials[materialName]
    /* const material = new THREE.MeshStandardMaterial({
      name: materialName,
      map: texture,
      side: THREE.DoubleSide,
    }); */
    return texture;
  };

  const renderActionButtons = () => {
    return (
      <div
        className={`position-absolute d-flex ${
          deviceType === "desktop" ? "flex-row" : "flex-column"
        }`}
        style={{ zIndex: 3 }}
      >
        <Button
          variant="secondary"
          className={deviceType === "desktop" ? "m-2" : "m-2 mb-1"}
          size="sm"
          disabled={fileLoding}
          onClick={() => setShowModal(true)}
          // onClick={() => importInputRef.current.click()}
        >
          <BsLaptop size="1.2rem" />
        </Button>
        <input
          ref={importInputRef}
          type="file"
          name="file"
          onChange={importFile}
          className="d-none"
        />
        <Button
          variant="secondary"
          className={deviceType === "desktop" ? "mx-1 my-2" : "mx-2 my-1"}
          size="sm"
          disabled={fileLoding}
          onClick={exportFile}
        >
          <GoDesktopDownload size="1.2rem" />
        </Button>
      </div>
    );
  };

  // const renderSpinner = () => {
  //   return (
  //     <>
  //       {/* {progress !== 100 || fileLoding && ( */}
  //       {loading && (
  //         <div
  //           className="w-100 h-100 d-flex justify-content-center align-items-center position-absolute"
  //           style={{ zIndex: 2 }}
  //         >
  //           <Spinner animation="border" variant="warning" size="lg" />
  //         </div>
  //       )}
  //     </>
  //   );
  // };

  const renderMaterialName = () => {
    return (
      <>
        {snap.current && (
          <div
            className="w-100 position-absolute d-flex justify-content-end px-2"
            style={{ zIndex: 2 }}
          >
            <p className="m-0 fw-bold" style={{ color: "#f77200" }}>
              {snap.current}
            </p>
          </div>
        )}
      </>
    );
  };

  const renderMeshes = (tempNodes) => {
    // const nodeKeys = Object.keys(nodes) || [];

    tempNodes.forEach((meshNode, index) => {
      // const meshNode = nodes[key];
      if (meshNode.material) {
        /* const boundingBox = new THREE.Box3();
        boundingBox.copy( meshNode.geometry.boundingBox );
        meshNode.updateMatrixWorld( true );
        boundingBox.applyMatrix4( meshNode.matrixWorld ); */

        // meshNode.geometry.center()
        // meshNode.geometry.computeBoundingBox();
        // meshNode.geometry.computeBoundingSphere();
        // meshNode.geometry.computeTangents();
        // meshNode.geometry.computeVertexNormals();
        if (snap.BackgroundTexture[meshNode.material.name]) {
          meshNode.material.color = new THREE.Color("#ffffff");
          const backgroundImage = new Image();
          backgroundImage.src = snap.BackgroundTexture[meshNode.material.name];
          const texture1 = new THREE.Texture();
          backgroundImage.onload = function () {
            texture1.needsUpdate = true;
          };

          texture1.image = backgroundImage;
          texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
          texture1.offset.set(+1.2, -2.38);
          texture1.repeat.set(3, 4);
          texture1.anisotropy = 12;
          texture1.encoding = THREE.sRGBEncoding;
          texture1.flipY = false;
          meshNode.material.map = texture1;
          if (snap.TargetTexture[meshNode.material.name]) {
            let name = meshNode.material.name;
            const targetImage = new Image();
            targetImage.src = snap.TargetTexture[meshNode.material.name];

            targetImage.onload = function () {
              texture2.needsUpdate = true;
            };
            // texture2 = new THREE.TextureLoader().load( snap.BackgroundTexture[meshNode.material.name] )
            texture2.image = targetImage;
            texture2.wrapS = texture2.wrapT = THREE.ClampToEdgeWrapping;
            texture2.offset.set(-0.1, 5.95);
            texture2.repeat.set(2.26, 7.04);
            texture2.anisotropy = 12;
            texture2.encoding = THREE.sRGBEncoding;
            texture2.flipY = false;
            console.log("clothemodal", targetImage.src);
            console.log("clothemodal_texture2", texture2.image.src);
            if (Array.isArray(meshNode.material)) {
              meshNode.material = meshNode.material[0];
            }

            meshNode.material = [
              meshNode.material.clone(),
              meshNode.material.clone(),
            ];
            meshNode.material.name = name;
            meshNode.material[0].map = texture1;
            meshNode.material[0].transparent = false;
            meshNode.material[1].transparent = true;
            meshNode.material[1].depthFunc = THREE.EqualDepth;
            meshNode.material[1].alphaTest = 0.5;
            meshNode.material[1].depthWrite = false;
            meshNode.material[1].map = texture2;
          }
          // console.log("tex2", texture2);
          // meshNode.geometry.addGroup(0, Infinity, 1);
        }
        if (snap.items[meshNode.material.name]) {
          const initialTexture = getWhiteTexture();
          const _color = new THREE.Color(snap.items[meshNode.material.name]);
          if (!snap.BackgroundTexture[meshNode.material.name]) {
            meshNode.material.map = initialTexture;
          }
          meshNode.material.color = _color;
        }
      }
      /* otherNodes.forEach((node, index) =>
      result.push(
        <mesh key={"other-"+index} receiveShadow geometry={node.geometry} />
      )
    ); */
      // return result;
    });
  };

  // if (!nodes || !materials) return <></>;

  // console.log({ nodes, materials });
  // console.log({ fileLoding })
  // console.log({ A: nodes.filter(n => n.material?.name === "Material1832114") })
  // console.log({ B: nodes.filter(n => n.material?.name !== "Material1832114") })
  // console.log({ B: nodes.filter(n => n.children?.length > 0) })
  // console.log({ Meshes: renderMeshes() })
  return (
    <div className="model-content">
      {renderActionButtons()}
      {/* {renderSpinner()} */}
      {renderMaterialName()}
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          background: "grey",
          borderRadius: "5px",
          padding: "10px",
          zIndex: "3"
        }}
      >
        <table>
          <tbody>
          <tr>
            <td>offsetX</td>
            <td>
              <input type="range" name="offsetX" min="-40" max="60" onChange={(e) => onChange(e)} />
            </td>
          </tr>
          <tr>
            <td>offsetY</td>
            <td>
              <input type="range"name="offsetY" min="-40" max="60"  onChange={(e) => onChange(e)} />
            </td>
          </tr>
          <tr>
            <td>repeatX</td>
            <td>
              <input type="range" name="repeatX" min="0" max="100" onChange={(e) => onChange(e)} />           </td>
          </tr>
          <tr>
            <td>repeatY</td>
            <td>
              <input type="range" name="repeatY" min="0" max="100"  onChange={(e) => onChange(e)} />
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      {/* <div ref={refContainer} className="canvas-container" style={{ height: "100%", width: "100%" }}></div> */}
      <Canvas
        id="canvas-content"
        className="canvas-content"
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1] }}
      >
        <ambientLight intensity={0.1} />
        <spotLight
          intensity={0.2}
          angle={0.1}
          penumbra={0.5}
          position={[10, 15, 10]}
        />
        <Suspense fallback={null}>
          <group
            ref={modelRef}
            dispose={null}
            position={[0, -0.9, 0]}
            onPointerOver={(e) => (
              e.stopPropagation(), loadCursor(e.object.material.name)
            )}
            onPointerOut={(e) =>
              e.intersections.length === 0 && loadCursor(null)
            }
            onPointerMissed={() => (snapState.current = null)}
            onPointerDown={(e) => (
              e.stopPropagation(),
              Array.isArray(e.object.material)
                ? (snapState.current = e.object.material[0].name)
                : (snapState.current = e.object.material.name)
            )}
          >
            <primitive object={glbScene}></primitive>
            {/* {renderMeshes()} */}

            {/* {meshes} */}
          </group>
          <Environment files="royal_esplanade_1k.hdr" />
          {/* <Environment preset="forest" /> */}
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -0.8, 0]}
            opacity={0.25}
            width={10}
            height={10}
            blur={2}
            far={1}
          />
        </Suspense>
        <OrbitControls
          // minPolarAngle={0}
          // maxPolarAngle={Math.PI}
          minDistance={0.5}
          maxDistance={1.5}
          enableZoom={true}
          enablePan={false}
        />
      </Canvas>
      <Modal
        show={showModal}
        fullscreen={deviceType !== "desktop"}
        centered
        size="lg"
        backdrop="static"
        contentClassName="upload-modal"
        onHide={() => setShowModal(false)}
      >
        {/* {console.log("sssssssssss", isUploading)} */}
        <Modal.Body>
          {/* <div className="image-drag-content" onClick={() => importInputRef.current.click()}> */}
          <div className="w-100 h-100 d-flex justify-content-center align-items-center">
            <div
              className={`w-100 h-${
                deviceType !== "desktop" ? "50" : "100"
              } position-relative`}
            >
              <div
                className="modal-close-btn"
                role="button"
                onClick={() => setShowModal(false)}
              >
                <GrClose size="1.5rem" />
              </div>
              <FileDropzone
                loadFile={importFile}
                loading={fileLoding}
                isUploading={isUploading}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ClotheModel;
