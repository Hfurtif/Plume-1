import React, { useState } from 'react';
import { 
  School, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShieldCheck, 
  UserCheck, 
  Wallet, 
  Clock, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  FileText,
  Lock,
  Building,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SchoolCycle, SchoolProfile } from '../../types';
import { SUPPORTED_COUNTRIES } from '../../data/mockData';

export const SchoolRegistrationModal: React.FC = () => {
  const { 
    isSchoolRegisterModalOpen, 
    setIsSchoolRegisterModalOpen, 
    registerNewSchool 
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: School Identity & Location
  const [name, setName] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('BJ');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [motto, setMotto] = useState('Discipline • Travail • Rigueur • Succès');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [selectedCycles, setSelectedCycles] = useState<SchoolCycle[]>(['maternelle', 'primaire', 'college', 'lycee']);

  // Step 2: Logo & Visual Identity
  const [logoPreview, setLogoPreview] = useState<string>('/src/assets/images/plume_app_icon_1790683767339.jpg');
  const [logoFileName, setLogoFileName] = useState<string>('Logo par défaut Plume');

  // Step 3: Signatories for bulletins and official docs
  const [proviseurName, setProviseurName] = useState('');
  const [proviseurTitle, setProviseurTitle] = useState('Chef d\'Établissement & Proviseur');
  const [comptableName, setComptableName] = useState('');
  const [comptableTitle, setComptableTitle] = useState('Intendant & Gestionnaire Financier');
  const [surveillantName, setSurveillantName] = useState('');
  const [surveillantTitle, setSurveillantTitle] = useState('Censeur des Études & Surveillant Général');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registeredResult, setRegisteredResult] = useState<SchoolProfile | null>(null);

  if (!isSchoolRegisterModalOpen) return null;

  const currentCountry = SUPPORTED_COUNTRIES.find(c => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  // Handle image upload with FileReader to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('L\'image du logo ne doit pas dépasser 5 Mo.');
      return;
    }

    setFormError(null);
    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCycle = (cycle: SchoolCycle) => {
    if (selectedCycles.includes(cycle)) {
      if (selectedCycles.length > 1) {
        setSelectedCycles(prev => prev.filter(c => c !== cycle));
      }
    } else {
      setSelectedCycles(prev => [...prev, cycle]);
    }
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setFormError('Veuillez saisir le nom officiel de l\'établissement scolaire.');
      return false;
    }
    if (!locality.trim()) {
      setFormError('Veuillez préciser la ville ou localité de l\'école.');
      return false;
    }
    if (!address.trim()) {
      setFormError('Veuillez renseigner l\'adresse physique complète de l\'établissement.');
      return false;
    }
    if (!email.trim() && !googleEmail.trim()) {
      setFormError('Veuillez renseigner l\'email officiel ou le compte Google de l\'école.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!proviseurName.trim()) {
      setFormError('Veuillez renseigner le nom complet du Proviseur / Chef d\'Établissement (obligatoire pour signer sur le bulletin).');
      return false;
    }
    if (!comptableName.trim()) {
      setFormError('Veuillez renseigner le nom complet du Comptable / Intendant (obligatoire pour le visa financier du bulletin).');
      return false;
    }
    if (!surveillantName.trim()) {
      setFormError('Veuillez renseigner le nom complet du Surveillant Général / Censeur (obligatoire pour l\'assiduité sur le bulletin).');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    }
  };

  const handleRegisterSubmit = () => {
    setFormError(null);

    const effectiveGoogleEmail = googleEmail.trim() || email.trim();
    const effectivePhone = phone.trim() || `${currentCountry.dialCode} 21 00 00 00`;

    const res = registerNewSchool({
      name: name.trim(),
      country: currentCountry.name,
      countryCode: currentCountry.code,
      locality: locality.trim(),
      address: address.trim(),
      phone: effectivePhone,
      email: email.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
      googleEmail: effectiveGoogleEmail,
      logoUrl: logoPreview,
      motto: motto.trim() || 'Discipline • Travail • Rigueur • Succès',
      registrationNumber: registrationNumber.trim() || `AGR-${Math.floor(1000 + Math.random() * 9000)}/MEN`,
      cycles: selectedCycles,
      signatories: {
        proviseurName: proviseurName.trim(),
        proviseurTitle: proviseurTitle.trim(),
        comptableName: comptableName.trim(),
        comptableTitle: comptableTitle.trim(),
        surveillantName: surveillantName.trim(),
        surveillantTitle: surveillantTitle.trim()
      }
    });

    if (res.success) {
      setRegisteredResult(res.school);
      setIsSuccess(true);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header Banner */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Inscription d'un Établissement Scolaire</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Essai 30 Jours Inclus
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configurez le nom, le logo, le pays et les signataires officiels des bulletins
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSchoolRegisterModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar (when not in success view) */}
          {!isSuccess && (
            <div className="px-6 pt-4 pb-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              {[
                { s: 1, label: '1. Établissement & Pays' },
                { s: 2, label: '2. Logo de l\'École' },
                { s: 3, label: '3. Les 3 Signataires' },
                { s: 4, label: '4. Essai 30J ($15/mois)' }
              ].map(item => (
                <div 
                  key={item.s} 
                  className={`flex-1 flex items-center gap-2 pb-2 border-b-2 transition-all ${
                    step === item.s 
                      ? 'border-cyan-400 text-cyan-300 font-bold' 
                      : step > item.s 
                      ? 'border-emerald-500 text-emerald-400 font-medium' 
                      : 'border-slate-800 text-slate-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    step === item.s 
                      ? 'bg-cyan-500 text-slate-950' 
                      : step > item.s 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step > item.s ? '✓' : item.s}
                  </span>
                  <span className="hidden sm:inline truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {formError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {isSuccess && registeredResult ? (
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">
                    Félicitations ! Votre Établissement est Enregistré
                  </h4>
                  <p className="text-sm text-slate-300 font-medium">
                    {registeredResult.name} ({registeredResult.country})
                  </p>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2">
                    Votre période d'essai gratuit de <strong className="text-emerald-400">30 jours</strong> est active à partir d'aujourd'hui.
                    Tous les bulletins, reçus et certificats afficheront automatiquement votre logo et les noms de vos signataires.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Période d'essai :</span>
                    <strong className="text-emerald-400 font-bold">30 jours gratuits (J-30)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Abonnement après 30 jours :</span>
                    <strong className="text-cyan-400 font-bold">15 $ / mois</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Proviseur signataire :</span>
                    <span className="text-white font-medium">{registeredResult.signatories.proviseurName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Comptable signataire :</span>
                    <span className="text-white font-medium">{registeredResult.signatories.comptableName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Surveillant Général :</span>
                    <span className="text-white font-medium">{registeredResult.signatories.surveillantName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Sauvegarde Google Drive :</span>
                    <span className="text-amber-400 font-mono">{registeredResult.googleEmail}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsSchoolRegisterModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Accéder à mon Établissement
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              /* STEP 1: General Info & Country */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* School Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nom officiel de l'Établissement <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Complexe Scolaire International Plume Excellence"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Country Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pays où se trouve l'école <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountryCode}
                        onChange={e => {
                          setSelectedCountryCode(e.target.value);
                          const cnt = SUPPORTED_COUNTRIES.find(c => c.code === e.target.value);
                          if (cnt && !phone) {
                            setPhone(`${cnt.dialCode} `);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
                      >
                        {SUPPORTED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                            {c.flag} {c.name} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Locality / City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Ville / Localité / Commune <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={e => setLocality(e.target.value)}
                      placeholder="Ex: Cotonou, Abidjan, Dakar, Yaoundé, Paris..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Full Physical Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Adresse physique complète de l'école <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Ex: Quartier Haie Vive, Boulevard de la Marina, BP 120"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Téléphone / WhatsApp officiel de l'école
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex: +229 21 30 15 88"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email officiel du secrétariat
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Ex: contact@ecole-excellence.org"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Google Email for Drive */}
                  <div className="md:col-span-2 bg-cyan-950/20 p-3.5 rounded-2xl border border-cyan-500/20">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-cyan-300 mb-1">
                          Email Google de l'établissement (Compte Gmail / Workspace)
                        </label>
                        <p className="text-[11px] text-slate-400 mb-2">
                          Utilisé pour la sauvegarde automatique et l'archivage sécurisé des bulletins et notes directement sur le Google Drive de l'école.
                        </p>
                        <input
                          type="email"
                          value={googleEmail}
                          onChange={e => setGoogleEmail(e.target.value)}
                          placeholder="Ex: ecole.direction.officiel@gmail.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Motto & Registration number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Devise de l'établissement
                    </label>
                    <input
                      type="text"
                      value={motto}
                      onChange={e => setMotto(e.target.value)}
                      placeholder="Ex: Discipline • Rigueur • Succès"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      N° d'Agrément ministériel ou Immatriculation
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={e => setRegistrationNumber(e.target.value)}
                      placeholder="Ex: DEC/N°2023-4412/A"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Cycles */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Cycles & Niveaux d'enseignement assurés
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'maternelle', label: 'Maternelle (TPS à GS)' },
                        { id: 'primaire', label: 'Primaire (CP à CM2)' },
                        { id: 'college', label: 'Collège (6e à 3e)' },
                        { id: 'lycee', label: 'Lycée (2nde à Tle)' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleCycle(item.id as SchoolCycle)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                            selectedCycles.includes(item.id as SchoolCycle)
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {selectedCycles.includes(item.id as SchoolCycle) ? '✓ ' : ''}{item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 2 ? (
              /* STEP 2: Logo & Visual Branding */
              <div className="space-y-5">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Logo Officiel de l'Établissement</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ce logo apparaîtra en haute résolution au sommet de chaque bulletin scolaire, relevé de notes, certificat de scolarité et quittance de paiement.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                  {/* File Upload Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Téléverser le logo (PNG, JPG, SVG)
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl bg-slate-950/80 cursor-pointer transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 mt-3">
                        Cliquez pour choisir le fichier
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Glisser-déposer ou sélectionner depuis votre ordinateur
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {logoFileName && (
                      <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fichier chargé : {logoFileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Bulletin Live Preview Card */}
                  <div className="p-4 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 font-sans">
                    <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-widest text-center border-b pb-1 mb-2">
                      Aperçu En-Tête de Bulletin Officiel
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                          RÉPUBLIQUE DU {currentCountry.name.toUpperCase()}
                        </div>
                        <div className="text-sm font-black text-slate-900 leading-tight">
                          {name || 'GROUPE SCOLAIRE EXCELLENCE'}
                        </div>
                        <div className="text-[9px] text-slate-600 italic">
                          {motto || 'Discipline • Rigueur • Réussite'}
                        </div>
                        <div className="text-[8px] text-slate-500 mt-1">
                          {address || 'Avenue de l\'Éducation'} • {locality || currentCountry.name}
                        </div>
                      </div>

                      {/* Preview Image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-md flex items-center justify-center shrink-0">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <School className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Vous pourrez également modifier ou réimporter ce logo à tout moment depuis les paramètres de l'administration.
                  </span>
                </div>
              </div>
            ) : step === 3 ? (
              /* STEP 3: The 3 Signatories (Proviseur, Comptable, Surveillant Général) */
              <div className="space-y-4">
                <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-500/30">
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Les 3 Signataires Officiels du Bulletin Scolaire</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Comme demandé, l'école doit renseigner les <strong>noms complets</strong> des personnes habilitées à signer sur les bulletins de notes :
                    le <strong>Proviseur</strong>, le <strong>Comptable</strong> et le <strong>Surveillant Général / Censeur</strong>.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* 1. Proviseur / Chef d'établissement */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-cyan-300">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span>1. Proviseur / Chef d'Établissement (Direction)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nom & Prénom complet <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={proviseurName}
                          onChange={e => setProviseurName(e.target.value)}
                          placeholder="Ex: Dr. Marc-Aurèle Valmont"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Titre officiel sur le bulletin
                        </label>
                        <input
                          type="text"
                          value={proviseurTitle}
                          onChange={e => setProviseurTitle(e.target.value)}
                          placeholder="Chef d'Établissement & Proviseur"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Comptable / Intendant */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-300">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>2. Comptable / Intendant (Visa Financier & Frais de Scolarité)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nom & Prénom complet <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={comptableName}
                          onChange={e => setComptableName(e.target.value)}
                          placeholder="Ex: M. Paul Ndongo"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Titre officiel sur le bulletin
                        </label>
                        <input
                          type="text"
                          value={comptableTitle}
                          onChange={e => setComptableTitle(e.target.value)}
                          placeholder="Intendant & Gestionnaire Financier"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Surveillant Général / Censeur */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-300">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>3. Surveillant Général / Censeur (Discipline & Assiduité)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nom & Prénom complet <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={surveillantName}
                          onChange={e => setSurveillantName(e.target.value)}
                          placeholder="Ex: M. Gilbert Dossou"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Titre officiel sur le bulletin
                        </label>
                        <input
                          type="text"
                          value={surveillantTitle}
                          onChange={e => setSurveillantTitle(e.target.value)}
                          placeholder="Censeur des Études & Surveillant Général"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bulletin Signature Preview */}
                <div className="p-3 bg-white text-slate-900 rounded-xl border border-slate-300 text-[10px] font-sans">
                  <div className="font-bold uppercase tracking-wider text-center text-slate-500 mb-2 pb-1 border-b">
                    Aperçu des 3 Signatures en bas du Bulletin
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border-r border-slate-200 pr-1">
                      <div className="font-bold text-slate-800">Le Comptable</div>
                      <div className="italic text-slate-500 my-1">[Visa Frais Apurés]</div>
                      <div className="font-semibold text-emerald-800 text-[9px]">{comptableName || 'Nom Comptable'}</div>
                    </div>
                    <div className="border-r border-slate-200 pr-1">
                      <div className="font-bold text-slate-800">Le Surveillant Général</div>
                      <div className="italic text-slate-500 my-1">[Visa Discipline]</div>
                      <div className="font-semibold text-indigo-800 text-[9px]">{surveillantName || 'Nom Surveillant'}</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Le Proviseur</div>
                      <div className="italic text-slate-500 my-1">[Sceau & Signature]</div>
                      <div className="font-semibold text-cyan-900 text-[9px]">{proviseurName || 'Nom Proviseur'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 4: Trial Period (30 Days) & $15/month Pricing */
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-cyan-950/40 p-5 rounded-2xl border border-emerald-500/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-white">
                    Période d'Essai Gratuite de 30 Jours
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Votre école peut commencer immédiatement à utiliser la plateforme en toute liberté pendant <strong>30 jours</strong>.
                    Aucune carte bancaire requise pour débuter !
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 30-Day Free Period */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                      Pendant les 30 premiers jours
                    </div>
                    <div className="text-2xl font-black text-white">
                      0 $ <span className="text-xs font-normal text-slate-400">/ 1er mois gratuit</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Accès illimité à toutes les fonctionnalités</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Saisie et verrouillage des notes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Édition des bulletins officiels A4 avec logo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Portail parents et enseignants en temps réel</span>
                      </li>
                    </ul>
                  </div>

                  {/* Standard Subscription */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/40 border border-cyan-500/40 space-y-2 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Tarif Établissement
                    </div>
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                      Après 30 jours (Abonnement)
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      15 $ <span className="text-xs font-normal text-slate-300">/ mois</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Environ 9 000 FCFA / mois ou 15 € / mois.
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Paiement par Mobile Money (Wave, MTN, Moov, Orange)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Ou par Carte Bancaire / Virement</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Restriction automatique après 30 jours si non renouvelé</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-200">Protection des données & Souveraineté :</strong> Vos données scolaires restent strictement confidentielles et synchronisées avec votre compte Google Drive officiel (<span className="text-cyan-300 font-mono">{googleEmail || email || 'votre email'}</span>).
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          {!isSuccess && (
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((step - 1) as any)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsSchoolRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Annuler
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleRegisterSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider & Démarrer l'Essai (30 Jours)</span>
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
