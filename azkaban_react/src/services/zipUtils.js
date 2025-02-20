import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const generateZipAzkaban = async (nodes) => {
    const zip = new JSZip();

    nodes.forEach((node) => {
        const content = `type=${node.data.type}\nworking.dir=${node.data.workingDir}\ncommand=${node.data.command}\ndependencies=${node.data.dependencies.join(', ')}`;
        zip.file(`${node.data.label}.job`, content);
    });

    return await zip.generateAsync({ type: 'blob' });
};

export const generateZip = (nodes) => {
    const zip = new JSZip();
    nodes.forEach((node) => {
      const content = `type=${node.data.type}\nworking.dir=${node.data.workingDir}\ncommand=${node.data.command}\ndependencies=${node.data.dependencies.join(', ')}`;
      zip.file(`${node.data.label}.job`, content);
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'jobs.zip');
    });
  };