// components/modals/ImportExcelModal.js
import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '@/lib/api-client';

export default function ImportExcelModal({
  isOpen,
  onClose,
  onImportSuccess,
  templateUrl,
  entityType = 'programmes',
  title = 'Importer depuis Excel',
  subtitle = 'Programme et modules'
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Format de fichier invalide. Veuillez uploader un fichier Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    // Vérifier la taille (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale : 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Vérifier que les feuilles nécessaires existent
          if (!workbook.SheetNames.includes('Programme') || !workbook.SheetNames.includes('Modules')) {
            reject(new Error('Le fichier doit contenir deux feuilles: "Programme" et "Modules"'));
            return;
          }

          const programmeSheet = workbook.Sheets['Programme'];
          const modulesSheet = workbook.Sheets['Modules'];

          const programmeRows = XLSX.utils.sheet_to_json(programmeSheet);
          const modulesRows = XLSX.utils.sheet_to_json(modulesSheet);

          if (!programmeRows || programmeRows.length === 0) {
            reject(new Error('Aucune donnée de programme trouvée dans la feuille "Programme"'));
            return;
          }

          resolve({ programmeData: programmeRows[0], modulesData: modulesRows });
        } catch (err) {
          reject(new Error('Erreur lors de la lecture du fichier Excel: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Parser le fichier Excel côté client
      const { programmeData, modulesData } = await parseExcelFile(file);

      // Validation des champs requis du programme
      const requiredFields = ['code', 'name', 'semestre', 'niveau', 'dateDebut', 'dateFin'];
      const missingFields = requiredFields.filter(field => !programmeData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Champs manquants dans la feuille Programme: ${missingFields.join(', ')}`);
      }

      // Validation des modules
      if (!modulesData || modulesData.length === 0) {
        throw new Error('Aucun module trouvé dans la feuille "Modules"');
      }

      const moduleRequiredFields = ['code', 'name', 'cm', 'td', 'tp', 'tpe', 'coefficient', 'credits'];
      for (let i = 0; i < modulesData.length; i++) {
        const mod = modulesData[i];
        const missingModuleFields = moduleRequiredFields.filter(field =>
          mod[field] === undefined || mod[field] === null || mod[field] === ''
        );
        if (missingModuleFields.length > 0) {
          throw new Error(`Module ligne ${i + 2}: Champs manquants: ${missingModuleFields.join(', ')}`);
        }
      }

      // Préparer les modules avec calcul du VHT
      const modules = modulesData.map(mod => {
        const cm = parseInt(mod.cm) || 0;
        const td = parseInt(mod.td) || 0;
        const tp = parseInt(mod.tp) || 0;
        const tpe = parseInt(mod.tpe) || 0;
        return {
          code: mod.code,
          name: mod.name,
          description: mod.description || '',
          cm,
          td,
          tp,
          tpe,
          vht: cm + td + tp + tpe,
          coefficient: parseInt(mod.coefficient) || 1,
          credits: parseInt(mod.credits) || 1,
        };
      });

      // Appeler l'API backend de création de programme
      const result = await apiClient.programmes.create({
        name: programmeData.name,
        code: programmeData.code,
        description: programmeData.description || '',
        semestre: programmeData.semestre,
        niveau: programmeData.niveau,
        dateDebut: programmeData.dateDebut,
        dateFin: programmeData.dateFin,
        modules,
      });

      setSuccess(`Programme "${result.name || programmeData.name}" importé avec succès (${modules.length} modules)`);
      setFile(null);

      // Notifier le parent après 2 secondes
      setTimeout(() => {
        onImportSuccess?.(result);
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Erreur import:', err);
      setError(err.message || 'Erreur lors de l\'importation du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setIsDragging(false);
    onClose();
  };

  const handleDownloadTemplate = () => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    } else {
      // Télécharger le template depuis l'API
      window.open(`/api/${entityType}/template`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {title}
                </h2>
                <p className="text-sm text-gray-500">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={uploading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Template download */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Télécharger le template Excel
                </h3>
                <p className="text-xs text-blue-700">
                  Utilisez notre modèle pour structurer vos données correctement.
                  Le fichier doit contenir deux feuilles : "Programme" et "Modules".
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Template</span>
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />

            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  disabled={uploading}
                >
                  Changer de fichier
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    Glissez-déposez votre fichier Excel ici
                  </p>
                  <p className="text-sm text-gray-500">ou</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled={uploading}
                >
                  Parcourir les fichiers
                </button>
                <p className="text-xs text-gray-500">
                  Formats acceptés : .xlsx, .xls, .csv (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={uploading}
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{uploading ? 'Importation...' : 'Importer'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Format du fichier Excel :
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Feuille "Programme"</strong> : code, name, semestre, niveau, dateDebut, dateFin, description</li>
              <li>• <strong>Feuille "Modules"</strong> : code, name, cm, td, tp, tpe, coefficient, credits, description</li>
              <li>• Les dates doivent être au format YYYY-MM-DD</li>
              <li>• Le semestre doit être : SEMESTRE_1, SEMESTRE_2, etc.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
