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
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
 
import '@xyflow/react/dist/style.css';
import './index.css'
 
const initialNodes = [
  { id: '1', position: { x: 300, y: 200 }, data: { label: 'Job 1', type: '', workingDir: '', command: '', dependencies: [] } },
  { id: '2', position: { x: 300, y: 300 }, data: { label: 'Job 2', type: '', workingDir: '', command: '', dependencies: ['Job 1'] } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
 
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(3);
  const [selectedNode, setSelectedNode] = useState(null);

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
  
  const addNode = () => {
    const lastNode = nodes[nodes.length - 1];
    const newNode = {
      id: `${nodeId}`,
      position: { x: 300, y: lastNode.position.y + 100 },
      data: { 
        label: `Job ${nodeId}`, 
        type: '', 
        workingDir: '', 
        command: '', 
        dependencies: [lastNode.data.label] 
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, { id: `e${lastNode.id}-${nodeId}`, source: lastNode.id, target: `${nodeId}` }]);
    setNodeId((id) => id + 1);
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

  const generateZip = () => {
    const zip = new JSZip();
    nodes.forEach((node) => {
      const content = `type=${node.data.type}\nworking.dir=${node.data.workingDir}\ncommand=${node.data.command}\ndependencies=${node.data.dependencies.join(', ')}`;
      zip.file(`${node.data.label}.job`, content);
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'jobs.zip');
    });
  };
 
  return (
    <div>
    <header className="header">
      <h1 className="title">Azkaban Flow Designer</h1>
    </header>
    <div className='main'>
      <div className= 'add-buttons-section'>
        <button onClick={addNode} className='add-button'>Add Node</button>
        <button onClick={addNode} className='add-button'>Add Node</button>
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
      <div className= 'edit-section'>
        {selectedNode && (
          <div className='node-popup'>
            <h3>{selectedNode.data.label}</h3>
            <label>Type: <input type="text" value={selectedNode.data.type} onChange={(e) => handleInputChange('type', e.target.value)} /></label><br />
            <label>Working Directory: <input type="text" value={selectedNode.data.workingDir} onChange={(e) => handleInputChange('workingDir', e.target.value)} /></label><br />
            <label>Command: <input type="text" value={selectedNode.data.command} onChange={(e) => handleInputChange('command', e.target.value)} /></label><br />
            <p><strong>Dependencies:</strong> {selectedNode.data.dependencies.join(', ')}</p>
            <button onClick={closePopup} style={{ marginTop: '10px', padding: '5px 10px', fontSize: '14px' }}>Close</button>
          </div>
        )}
        <button onClick={generateZip} className='download-button' >Generate ZIP</button>
      </div>
      
    </div>
    </div>
  );
}
