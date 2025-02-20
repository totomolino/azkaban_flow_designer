import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import './index.css'
import { authenticate, createProject, uploadZip } from './services/azkabanApi';
import { generateZipAzkaban, generateZip } from './services/zipUtils';



 
export default function App() {
  const [projectName, setProjectName] = useState('test_project');

  const initialNodes = [
    { id: '1', position: { x: 300, y: 200 }, data: { label: `Start_${projectName}`, type: 'noop', workingDir: '', command: '', retries: '', dependencies: [] } },
  ];
  const initialEdges = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(3);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleProjectCreate = async () => {
    setIsUploading(true);

    const sessionId = await authenticate();
    if (!sessionId) {
        setIsUploading(false);
        return;
    }

    const projectCreated = await createProject(sessionId, projectName);
    if (projectCreated) {
        const zipBlob = await generateZipAzkaban(nodes);

        // Convert Blob to File object
        const zipFile = new File([zipBlob], `${projectName}.zip`, { type: "application/zip" });

        await uploadZip(sessionId, projectName, zipFile);
    }

    setIsUploading(false);
};


  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          dependencies: edges
            .filter((edge) => edge.target === node.id)
            .map((edge) => nodes.find((n) => n.id === edge.source)?.data.label || ''),
        },
      }))
    );
  }, [edges, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  
  const addNode = (type) => {
    if (type === "LDG" || type === "BRE") {
      const tableName = prompt("Enter the table name:");
      if (!tableName) return;
  
      if (type === "LDG") {
        const lastNode = nodes.length ? nodes[nodes.length - 1] : null;
        
        const dtNode = {
          id: `${nodeId}`,
          position: { x: 300, y: lastNode ? lastNode.position.y + 100 : 100 },
          data: {
            label: `${tableName}_DT`,
            type: "command",
            workingDir: "/usr/lib/ZDH/hub/spark_engine/",
            command: `python3 /usr/lib/ZDH/hub/spark_engine/ZDHDataTransferExecutor.py BI_LatAm ${tableName}`,
            retries: 0,
            dependencies: lastNode ? [lastNode.data.label] : []
          }
        };
  
        const laNode = {
          id: `${nodeId + 1}`,
          position: { x: 500, y: dtNode.position.y + 100 },
          data: {
            label: `${tableName}_LA`,
            type: "command",
            workingDir: "/usr/lib/ZDH/hub/spark_engine/",
            command: `python3 /usr/lib/ZDH/hub/spark_engine/ZDHLandingExecutor.py BI_LatAm ${tableName}`,
            retries: 0,
            dependencies: [dtNode.data.label]
          }
        };
  
        setNodes((nds) => [...nds, dtNode, laNode]);
        setEdges((eds) => [
          ...eds, 
          { id: `e${dtNode.id}-${laNode.id}`, source: dtNode.id, target: laNode.id }
        ]);
        setNodeId((id) => id + 2);
      } else if (type === "BRE") {
        const lastNode = nodes.length ? nodes[nodes.length - 1] : null;
        const breNode = {
          id: `${nodeId}`,
          position: { x: 300, y: lastNode ? lastNode.position.y + 100 : 100 },
          data: {
            label: `${tableName}`,
            type: "command",
            workingDir: "/usr/lib/ZDH/hub/spark_engine/",
            command: `python3 /usr/lib/ZDH/hub/spark_engine/ZDHBREWorkflowExecutor.py BI_LatAm ${tableName}`,
            retries: 0,
            dependencies: lastNode ? [lastNode.data.label] : []
          }
        };
  
        setNodes((nds) => [...nds, breNode]);
        setNodeId((id) => id + 1);
      }
    } else if (type === "End") {
      const leafNodes = nodes.filter(n => !edges.some(e => e.source === n.id));
  
      if (leafNodes.length === 0) {
        alert("No leaf nodes found!");
        return;
      }
  
      const endNode = {
        id: `${nodeId}`,
        position: { x: 300, y: Math.max(...leafNodes.map(n => n.position.y)) + 100 },
        data: {
          label: projectName,
          type: "noop",
          workingDir: "",
          command: "",
          dependencies: leafNodes.map(n => n.data.label)
        }
      };
  
      const newEdges = leafNodes.map(n => ({
        id: `e${n.id}-${nodeId}`,
        source: n.id,
        target: `${nodeId}`
      }));
  
      setNodes((nds) => [...nds, endNode]);
      setEdges((eds) => [...eds, ...newEdges]);
      setNodeId((id) => id + 1);
    } else {
      const lastNode = nodes.length ? nodes[nodes.length - 1] : null;
      const newNode = {
        id: `${nodeId}`,
        position: { x: 300, y: lastNode ? lastNode.position.y + 100 : 100 },
        data: {
          label: `Job ${nodeId}`,
          type: "",
          workingDir: "",
          command: "",
          dependencies: lastNode ? [lastNode.data.label] : []
        }
      };
  
      setNodes((nds) => [...nds, newNode]);
      setNodeId((id) => id + 1);
    }
  };  
  

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const closePopup = () => {
    setSelectedNode(null);
  };

  const handleInputChange = (field, value) => {
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNode.id ? { ...n, data: { ...n.data, [field]: value } } : n
    ));
    setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, [field]: value } }));
  };


 
  return (
    <div>
    <header className="header">
      <h1 className="title">Azkaban Flow Designer</h1>
    </header>
    <div className='main'>
      <div className="add-buttons-section">
        <button onClick={() => addNode("LDG")} className="add-button">Add LDG</button>
        <button onClick={() => addNode("BRE")} className="add-button">Add BRE</button>
        <button onClick={() => addNode("Custom")} className="add-button">Add Custom</button>
        <button onClick={() => addNode("End")} className="add-button">Add End</button>
      </div>
      <div className='flow-map' >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <div className='edit-section'>
        {selectedNode ? (
          <div className='node-popup'>
            <h3>{selectedNode.data.label}</h3>
            <label>Type: <br /><input type="text" className='node-input' value={selectedNode.data.type} onChange={(e) => handleInputChange('type', e.target.value)} /></label><br />
            <br /><label>Working Directory: <br /><input type="text" className='node-input' value={selectedNode.data.workingDir} onChange={(e) => handleInputChange('workingDir', e.target.value)} /></label><br />
            <br /><label>Command: <br /><textarea type="text" className='node-input' value={selectedNode.data.command} onChange={(e) => handleInputChange('command', e.target.value)} /></label><br />
            <br /><label>Retries: <br /><input type="text" className='node-input' value={selectedNode.data.retries} onChange={(e) => handleInputChange('retries', e.target.value)} /></label><br />
            <p><strong>Dependencies:</strong> {selectedNode.data.dependencies.join(', ')}</p>
            <button onClick={closePopup} className='popup-button'>Close</button>
          </div>
        ) : (
          <div className='node-popup'>
            <h3>Please select a node to edit it</h3>
          </div>
        )}
        <div className='download-section'>
          <button onClick={() => generateZip(nodes)} className='download-button' >Generate ZIP</button>
          <button
            onClick={handleProjectCreate}
            disabled={isUploading || !projectName}
            className='download-button'
          >
            {isUploading ? 'Uploading...' : 'Create & Upload'}
          </button>          
        </div>
      </div>
      
    </div>
    </div>
  );
}
