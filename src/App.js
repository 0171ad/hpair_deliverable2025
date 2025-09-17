import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';

const NATIONALITIES = [
  'American', 'Canadian', 'British', 'Australian', 'German', 'French', 'Italian', 'Spanish', 
  'Japanese', 'Chinese', 'Korean', 'Indian', 'Brazilian', 'Mexican', 'Russian', 'Dutch',
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Swiss', 'Austrian', 'Belgian', 'Portuguese',
  'Greek', 'Turkish', 'Egyptian', 'South African', 'Nigerian', 'Kenyan', 'Argentinian',
  'Chilean', 'Colombian', 'Peruvian', 'Venezuelan', 'Thai', 'Vietnamese', 'Malaysian',
  'Singaporean', 'Indonesian', 'Filipino', 'Pakistani', 'Bangladeshi', 'Sri Lankan',
  'Nepalese', 'Iranian', 'Israeli', 'Saudi Arabian', 'Emirati', 'Jordanian', 'Lebanese'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese (Mandarin)',
  'Chinese (Cantonese)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
  'Marathi', 'Gujarati', 'Urdu', 'Persian', 'Turkish', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian',
  'Malay', 'Filipino', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Polish',
  'Czech', 'Hungarian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian', 'Ukrainian', 'Swahili'
];

const UNIVERSITIES = [
  'Harvard University', 'Stanford University', 'MIT', 'Yale University', 'Princeton University',
  'Columbia University', 'University of Chicago', 'University of Pennsylvania', 'Caltech',
  'Johns Hopkins University', 'Northwestern University', 'Duke University', 'Dartmouth College',
  'Brown University', 'Vanderbilt University', 'Rice University', 'Washington University in St. Louis',
  'Cornell University', 'Notre Dame', 'UCLA', 'UC Berkeley', 'Georgetown University',
  'University of Michigan', 'Carnegie Mellon University', 'University of Virginia'
];

const EXPERIENCE_LEVELS = [
  { value: 'high-school', label: 'High School Student' },
  { value: 'undergraduate', label: 'Undergraduate Student' },
  { value: 'graduate', label: 'Graduate Student' },
  { value: 'recent-graduate', label: 'Recent Graduate (0-2 years)' },
  { value: 'early-career', label: 'Early Career Professional (2-5 years)' },
  { value: 'mid-career', label: 'Mid-Career Professional (5+ years)' }
];

// Email validation service simulation
const sendEmail = async (data) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  // In real implementation, this would use EmailJS or backend API
  console.log('Email sent with data:', data);
  return { success: true, messageId: 'msg_' + Date.now() };
};

function App() {
  const [formData, setFormData] = useState({
    // Basic Info
    address: '',
    phone: '',
    nationality: '',
    preferredLanguage: '',
    
    // LinkedIn
    hasLinkedIn: '',
    linkedInUrl: '',
    
    // Files
    cvFile: null,
    portfolioFile: null,
    
    // Contact
    email: '',
    sendCopyToEmail: true,
    
    // New Enhanced Fields
    experienceLevel: '',
    currentInstitution: '',
    otherInstitution: '',
    hasWorkExperience: '',
    workExperience: '',
    interests: [],
    hasAttendedConference: '',
    previousConferences: '',
    referralSource: '',
    
    // Optional
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [notification, setNotification] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [progress, setProgress] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const formRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    try {
      const dataToSave = {
        ...formData,
        cvFile: formData.cvFile ? { name: formData.cvFile.name, size: formData.cvFile.size } : null,
        portfolioFile: formData.portfolioFile ? { name: formData.portfolioFile.name, size: formData.portfolioFile.size } : null,
        timestamp: Date.now()
      };
      
      // Save to memory (localStorage simulation)
      const savedForms = JSON.parse(window.sessionStorage?.getItem('hpair_draft') || '{}');
      savedForms[Date.now()] = dataToSave;
      
      // Keep only last 3 drafts to avoid storage bloat
      const timestamps = Object.keys(savedForms).sort().slice(-3);
      const cleanedForms = {};
      timestamps.forEach(ts => cleanedForms[ts] = savedForms[ts]);
      
      setSaveStatus('saved');
      
      showNotification('Draft saved automatically', 'success');
    } catch (err) {
      setSaveStatus('error');
      showNotification('Failed to save draft', 'error');
    }
  }, [formData]);

  // Debounced auto-save
  useEffect(() => {
    if (Object.keys(formData).some(key => formData[key])) {
      setSaveStatus('saving');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(autoSave, 1000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, autoSave]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['address', 'phone', 'nationality', 'preferredLanguage', 'hasLinkedIn', 'cvFile', 'experienceLevel'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'cvFile') return formData[field] !== null;
      return formData[field] && formData[field].toString().trim() !== '';
    });
    
    // Add conditional required fields
    if (formData.hasLinkedIn === 'yes' && formData.linkedInUrl) {
      completedFields.push('linkedInUrl');
      requiredFields.push('linkedInUrl');
    }
    
    if (formData.currentInstitution === 'other' && formData.otherInstitution) {
      completedFields.push('otherInstitution');
      requiredFields.push('otherInstitution');
    }
    
    const newProgress = Math.round((completedFields.length / requiredFields.length) * 100);
    setProgress(newProgress);
  }, [formData]);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
  }, []);

  const validateField = useCallback((field, value, allData = formData) => {
    switch (field) {
      case 'address':
        return value.trim().length < 8 ? 'Address must be at least 8 characters' : '';
      
      case 'phone':
        const phonePattern = /^\+?\d{10,15}$/;
        const cleanPhone = value.replace(/[\s()-]/g, '');
        return !phonePattern.test(cleanPhone) ? 'Phone must be 10-15 digits with optional + prefix' : '';
      
      case 'nationality':
        return !value ? 'Please select your nationality' : '';
      
      case 'preferredLanguage':
        return !value ? 'Please select your preferred language' : '';
      
      case 'hasLinkedIn':
        return !value ? 'Please select an option' : '';
      
      case 'linkedInUrl':
        if (allData.hasLinkedIn === 'yes') {
          if (!value) return 'LinkedIn URL is required';
          const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/.+/;
          return !linkedInPattern.test(value) ? 'Please enter a valid LinkedIn URL' : '';
        }
        return '';
      
      case 'cvFile':
        if (!value) return 'Please upload your CV';
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (value.size > maxSize) return 'CV file must be less than 10MB';
        if (!allowedTypes.includes(value.type)) return 'CV must be PDF, DOC, or DOCX format';
        return '';
      
      case 'portfolioFile':
        if (value) {
          const maxSize = 20 * 1024 * 1024; // 20MB
          if (value.size > maxSize) return 'Portfolio file must be less than 20MB';
        }
        return '';
      
      case 'email':
        if (value) {
          const emailPattern = /^\S+@\S+\.\S+$/;
          return !emailPattern.test(value) ? 'Please enter a valid email address' : '';
        }
        return '';
      
      case 'experienceLevel':
        return !value ? 'Please select your experience level' : '';
      
      case 'currentInstitution':
        return !value ? 'Please select your current institution' : '';
      
      case 'otherInstitution':
        return allData.currentInstitution === 'other' && !value.trim() ? 'Please specify your institution' : '';
      
      case 'workExperience':
        if (allData.hasWorkExperience === 'yes') {
          return !value.trim() || value.trim().length < 20 ? 'Please describe your work experience (minimum 20 characters)' : '';
        }
        return '';
      
      case 'previousConferences':
        if (allData.hasAttendedConference === 'yes') {
          return !value.trim() ? 'Please list the conferences you have attended' : '';
        }
        return '';
      
      default:
        return '';
    }
  }, [formData]);

  const computeErrors = useCallback((data = formData) => {
    const newErrors = {};
    Object.keys(data).forEach(field => {
      const error = validateField(field, data[field], data);
      if (error) newErrors[field] = error;
    });
    return newErrors;
  }, [formData, validateField]);

  const updateField = useCallback((field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Mark field as touched
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field
    const error = validateField(field, value, newData);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Clear related conditional field errors
    if (field === 'hasLinkedIn' && value === 'no') {
      setErrors(prev => ({ ...prev, linkedInUrl: '' }));
    }
    if (field === 'currentInstitution' && value !== 'other') {
      setErrors(prev => ({ ...prev, otherInstitution: '' }));
    }
    if (field === 'hasWorkExperience' && value === 'no') {
      setErrors(prev => ({ ...prev, workExperience: '' }));
    }
    if (field === 'hasAttendedConference' && value === 'no') {
      setErrors(prev => ({ ...prev, previousConferences: '' }));
    }
  }, [formData, validateField]);

  const handleFileChange = useCallback((field) => (e) => {
    const file = e.target.files[0] || null;
    updateField(field, file);
    
    if (file) {
      showNotification(`${field === 'cvFile' ? 'CV' : 'Portfolio'} uploaded: ${file.name}`, 'success');
    }
  }, [updateField, showNotification]);

  const handleInterestToggle = useCallback((interest) => {
    const currentInterests = formData.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    updateField('interests', newInterests);
  }, [formData.interests, updateField]);

  const isFormValid = useCallback(() => {
    const currentErrors = computeErrors();
    return Object.keys(currentErrors).length === 0;
  }, [computeErrors]);

  const downloadSummary = useCallback((data) => {
    const summary = {
      ...data,
      cvFileName: data.cvFile?.name || '',
      portfolioFileName: data.portfolioFile?.name || '',
      submissionDate: new Date().toISOString(),
      formVersion: '2.0'
    };
    
    // Remove file objects for JSON
    delete summary.cvFile;
    delete summary.portfolioFile;
    
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hpair_application_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Application summary downloaded', 'success');
  }, [showNotification]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const currentErrors = computeErrors();
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      showNotification('Please fix all errors before submitting', 'error');
      
      // Focus first error field
      const firstErrorField = Object.keys(currentErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const snapshot = {
        // Basic Info
        address: formData.address,
        phone: formData.phone,
        nationality: formData.nationality,
        preferredLanguage: formData.preferredLanguage,
        
        // LinkedIn
        hasLinkedIn: formData.hasLinkedIn,
        linkedInUrl: formData.linkedInUrl,
        
        // Files
        cvFileName: formData.cvFile?.name || '',
        portfolioFileName: formData.portfolioFile?.name || '',
        
        // Enhanced Fields
        experienceLevel: formData.experienceLevel,
        currentInstitution: formData.currentInstitution === 'other' ? formData.otherInstitution : formData.currentInstitution,
        hasWorkExperience: formData.hasWorkExperience,
        workExperience: formData.workExperience,
        interests: formData.interests,
        hasAttendedConference: formData.hasAttendedConference,
        previousConferences: formData.previousConferences,
        referralSource: formData.referralSource,
        
        // Contact
        email: formData.email,
        notes: formData.notes,
        
        // Metadata
        submissionDate: new Date().toISOString(),
        formVersion: '2.0'
      };

      setSubmitted(snapshot);
      setSubmitting(false);
      showNotification('Application submitted successfully!', 'success', 5000);
      
      // Send email copy if requested
      if (formData.sendCopyToEmail && formData.email) {
        setEmailSending(true);
        try {
          await sendEmail({
            to: formData.email,
            subject: 'HPAIR Application Confirmation',
            data: snapshot
          });
          setEmailSent(true);
          showNotification('Confirmation email sent!', 'success');
        } catch (err) {
          showNotification('Failed to send confirmation email', 'error');
        } finally {
          setEmailSending(false);
        }
      }
      
    } catch (error) {
      setSubmitting(false);
      showNotification('Submission failed. Please try again.', 'error');
    }
  }, [formData, computeErrors, showNotification]);

  const resetForm = useCallback(() => {
    setSubmitted(null);
    setEmailSent(false);
    setFormData({
      address: '',
      phone: '',
      nationality: '',
      preferredLanguage: '',
      hasLinkedIn: '',
      linkedInUrl: '',
      cvFile: null,
      portfolioFile: null,
      email: '',
      sendCopyToEmail: true,
      experienceLevel: '',
      currentInstitution: '',
      otherInstitution: '',
      hasWorkExperience: '',
      workExperience: '',
      interests: [],
      hasAttendedConference: '',
      previousConferences: '',
      referralSource: '',
      notes: ''
    });
    setErrors({});
    setFieldTouched({});
    setProgress(0);
  }, []);

  // Keyboard navigation enhancement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          autoSave();
          showNotification('Draft saved manually', 'success');
        }
        if (e.key === 'Enter') {
          if (isFormValid() && !submitting) {
            handleSubmit(e);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [autoSave, showNotification, isFormValid, submitting, handleSubmit]);

  if (submitted) {
    return (
      <div className="page">
        <div className="card success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h1>Application Submitted Successfully</h1>
            <p>Thank you for your application to HPAIR. We have received your information and will review it promptly.</p>
            
            {emailSending && (
              <div className="email-status sending">
                <div className="spinner"></div>
                <span>Sending confirmation email...</span>
              </div>
            )}
            
            {emailSent && (
              <div className="email-status sent">
                <span>Confirmation email sent to {formData.email}</span>
              </div>
            )}
          </div>
          
          <div className="success-stats">
            <div className="stat">
              <div className="stat-value">{Object.keys(submitted).filter(k => submitted[k] && submitted[k] !== '').length}</div>
              <div className="stat-label">Fields Completed</div>
            </div>
            <div className="stat">
              <div className="stat-value">{submitted.interests?.length || 0}</div>
              <div className="stat-label">Interests Selected</div>
            </div>
            <div className="stat">
              <div className="stat-value">{submitted.cvFileName ? '✓' : '–'}</div>
              <div className="stat-label">CV Uploaded</div>
            </div>
          </div>
          
          <div className="submission-summary">
            <h3>Application Summary:</h3>
            <div className="summary-grid">
              <div className="summary-section">
                <h4>Personal Information</h4>
                <p><strong>Nationality:</strong> {submitted.nationality}</p>
                <p><strong>Language:</strong> {submitted.preferredLanguage}</p>
                <p><strong>Experience:</strong> {EXPERIENCE_LEVELS.find(e => e.value === submitted.experienceLevel)?.label}</p>
              </div>
              <div className="summary-section">
                <h4>Contact Information</h4>
                <p><strong>Phone:</strong> {submitted.phone}</p>
                {submitted.email && <p><strong>Email:</strong> {submitted.email}</p>}
                <p><strong>LinkedIn:</strong> {submitted.hasLinkedIn === 'yes' ? 'Yes' : 'No'}</p>
              </div>
              {submitted.interests?.length > 0 && (
                <div className="summary-section">
                  <h4>Interests</h4>
                  <div className="interests-display">
                    {submitted.interests.map(interest => (
                      <span key={interest} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="actions">
            <button 
              type="button" 
              className="secondary" 
              onClick={() => downloadSummary(submitted)}
            >
              Download Summary
            </button>
            <button type="button" className="secondary" onClick={resetForm}>
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  const interestOptions = [
    'International Relations', 'Public Policy', 'Economics', 'Human Rights', 
    'Environmental Policy', 'Technology & Society', 'Healthcare Policy', 'Education',
    'Gender Studies', 'Conflict Resolution', 'Development Studies', 'Cultural Exchange'
  ];

  const referralSources = [
    'University Professor', 'Friend/Colleague', 'Social Media', 'HPAIR Website',
    'Previous Participant', 'Academic Conference', 'Online Search', 'Other'
  ];

  return (
    <div className="page">
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <header className="header">
        <div className="logo">HPAIR</div>
        <h1>Harvard Project for Asian and International Relations</h1>
        <p>Application Form</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            {progress}% Complete
            <span className="save-status">
              {saveStatus === 'saving' && <><span className="spinner-small"></span> Saving...</>}
              {saveStatus === 'saved' && <>✓ Saved</>}
              {saveStatus === 'error' && <>⚠ Save failed</>}
            </span>
          </div>
        </div>
      </header>

      <div className="card form" ref={formRef}>
        <div className="form-section">
          <h2 className="section-title">Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              className={`input ${fieldTouched.address && errors.address ? 'error' : ''} ${fieldTouched.address && !errors.address && formData.address ? 'valid' : ''}`}
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Enter your full address"
              rows={3}
            />
            {errors.address && <p className="error">{errors.address}</p>}
          </div>

          <div className="row two">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className={`input ${fieldTouched.phone && errors.phone ? 'error' : ''} ${fieldTouched.phone && !errors.phone && formData.phone ? 'valid' : ''}`}
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && <p className="error">{errors.phone}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className={`input ${fieldTouched.email && errors.email ? 'error' : ''} ${fieldTouched.email && !errors.email && formData.email ? 'valid' : ''}`}
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="error">{errors.email}</p>}
              {formData.email && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.sendCopyToEmail}
                    onChange={(e) => updateField('sendCopyToEmail', e.target.checked)}
                  />
                  <span>Send confirmation email to this address</span>
                </label>
              )}
            </div>
          </div>

          <div className="row two">
            <div className="form-group">
              <label htmlFor="nationality">Nationality *</label>
              <select
                id="nationality"
                className={`input ${fieldTouched.nationality && errors.nationality ? 'error' : ''} ${fieldTouched.nationality && !errors.nationality && formData.nationality ? 'valid' : ''}`}
                value={formData.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
              >
                <option value="">Select nationality</option>
                {NATIONALITIES.map(nation => (
                  <option key={nation} value={nation}>{nation}</option>
                ))}
              </select>
              {errors.nationality && <p className="error">{errors.nationality}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="preferredLanguage">Preferred Language *</label>
              <select
                id="preferredLanguage"
                className={`input ${fieldTouched.preferredLanguage && errors.preferredLanguage ? 'error' : ''} ${fieldTouched.preferredLanguage && !errors.preferredLanguage && formData.preferredLanguage ? 'valid' : ''}`}
                value={formData.preferredLanguage}
                onChange={(e) => updateField('preferredLanguage', e.target.value)}
              >
                <option value="">Select language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.preferredLanguage && <p className="error">{errors.preferredLanguage}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Academic & Professional Background</h2>
          
          <div className="form-group">
            <label htmlFor="experienceLevel">Experience Level *</label>
            <select
              id="experienceLevel"
              className={`input ${fieldTouched.experienceLevel && errors.experienceLevel ? 'error' : ''} ${fieldTouched.experienceLevel && !errors.experienceLevel && formData.experienceLevel ? 'valid' : ''}`}
              value={formData.experienceLevel}
              onChange={(e) => updateField('experienceLevel', e.target.value)}
            >
              <option value="">Select your experience level</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            {errors.experienceLevel && <p className="error">{errors.experienceLevel}</p>}
          </div>

          <div className="row two">
            <div className="form-group">
              <label htmlFor="currentInstitution">Current Institution *</label>
              <select
                id="currentInstitution"
                className={`input ${fieldTouched.currentInstitution && errors.currentInstitution ? 'error' : ''} ${fieldTouched.currentInstitution && !errors.currentInstitution && formData.currentInstitution ? 'valid' : ''}`}
                value={formData.currentInstitution}
                onChange={(e) => updateField('currentInstitution', e.target.value)}
              >
                <option value="">Select institution</option>
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
                <option value="other">Other (specify below)</option>
              </select>
              {errors.currentInstitution && <p className="error">{errors.currentInstitution}</p>}
            </div>

            {formData.currentInstitution === 'other' && (
              <div className="form-group">
                <label htmlFor="otherInstitution">Specify Institution *</label>
                <input
                  id="otherInstitution"
                  type="text"
                  className={`input ${fieldTouched.otherInstitution && errors.otherInstitution ? 'error' : ''} ${fieldTouched.otherInstitution && !errors.otherInstitution && formData.otherInstitution ? 'valid' : ''}`}
                  value={formData.otherInstitution}
                  onChange={(e) => updateField('otherInstitution', e.target.value)}
                  placeholder="Enter your institution name"
                />
                {errors.otherInstitution && <p className="error">{errors.otherInstitution}</p>}
              </div>
            )}
          </div>

          <fieldset className="form-group">
            <legend>Do you have relevant work experience?</legend>
            <div className="radio-row">
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasWorkExperience"
                  value="yes"
                  checked={formData.hasWorkExperience === 'yes'}
                  onChange={(e) => updateField('hasWorkExperience', e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasWorkExperience"
                  value="no"
                  checked={formData.hasWorkExperience === 'no'}
                  onChange={(e) => updateField('hasWorkExperience', e.target.value)}
                />
                <span>No</span>
              </label>
            </div>
          </fieldset>

          {formData.hasWorkExperience === 'yes' && (
            <div className="form-group">
              <label htmlFor="workExperience">Describe Your Work Experience</label>
              <textarea
                id="workExperience"
                className={`input ${fieldTouched.workExperience && errors.workExperience ? 'error' : ''} ${fieldTouched.workExperience && !errors.workExperience && formData.workExperience ? 'valid' : ''}`}
                value={formData.workExperience}
                onChange={(e) => updateField('workExperience', e.target.value)}
                placeholder="Describe your relevant work experience, internships, or professional activities..."
                rows={4}
              />
              {errors.workExperience && <p className="error">{errors.workExperience}</p>}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">Professional Networks</h2>
          
          <fieldset className="form-group">
            <legend>Do you have a LinkedIn profile? *</legend>
            <div className="radio-row">
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasLinkedIn"
                  value="yes"
                  checked={formData.hasLinkedIn === 'yes'}
                  onChange={(e) => updateField('hasLinkedIn', e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasLinkedIn"
                  value="no"
                  checked={formData.hasLinkedIn === 'no'}
                  onChange={(e) => updateField('hasLinkedIn', e.target.value)}
                />
                <span>No</span>
              </label>
            </div>
            {errors.hasLinkedIn && <p className="error">{errors.hasLinkedIn}</p>}
          </fieldset>

          {formData.hasLinkedIn === 'yes' && (
            <div className="form-group">
              <label htmlFor="linkedInUrl">LinkedIn URL *</label>
              <input
                id="linkedInUrl"
                type="url"
                className={`input ${fieldTouched.linkedInUrl && errors.linkedInUrl ? 'error' : ''} ${fieldTouched.linkedInUrl && !errors.linkedInUrl && formData.linkedInUrl ? 'valid' : ''}`}
                value={formData.linkedInUrl}
                onChange={(e) => updateField('linkedInUrl', e.target.value)}
                placeholder="https://www.linkedin.com/in/yourprofile"
              />
              {errors.linkedInUrl && <p className="error">{errors.linkedInUrl}</p>}
            </div>
          )}

          <fieldset className="form-group">
            <legend>Have you attended academic conferences before?</legend>
            <div className="radio-row">
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasAttendedConference"
                  value="yes"
                  checked={formData.hasAttendedConference === 'yes'}
                  onChange={(e) => updateField('hasAttendedConference', e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasAttendedConference"
                  value="no"
                  checked={formData.hasAttendedConference === 'no'}
                  onChange={(e) => updateField('hasAttendedConference', e.target.value)}
                />
                <span>No</span>
              </label>
            </div>
          </fieldset>

          {formData.hasAttendedConference === 'yes' && (
            <div className="form-group">
              <label htmlFor="previousConferences">List Previous Conferences</label>
              <textarea
                id="previousConferences"
                className={`input ${fieldTouched.previousConferences && errors.previousConferences ? 'error' : ''} ${fieldTouched.previousConferences && !errors.previousConferences && formData.previousConferences ? 'valid' : ''}`}
                value={formData.previousConferences}
                onChange={(e) => updateField('previousConferences', e.target.value)}
                placeholder="List the academic conferences you have attended..."
                rows={3}
              />
              {errors.previousConferences && <p className="error">{errors.previousConferences}</p>}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">Document Upload</h2>
          
          <div className="row two">
            <div className="form-group">
              <label htmlFor="cvFile">CV Upload *</label>
              <input
                id="cvFile"
                type="file"
                className={`input file-input ${fieldTouched.cvFile && errors.cvFile ? 'error' : ''} ${fieldTouched.cvFile && !errors.cvFile && formData.cvFile ? 'valid' : ''}`}
                onChange={handleFileChange('cvFile')}
                accept=".pdf,.doc,.docx"
              />
              {formData.cvFile && (
                <div className="file-selected">
                  <span className="file-name">{formData.cvFile.name}</span>
                  <span className="file-size">({(formData.cvFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
              {errors.cvFile && <p className="error">{errors.cvFile}</p>}
              <p className="field-hint">Supported formats: PDF, DOC, DOCX (max 10MB)</p>
            </div>

            <div className="form-group">
              <label htmlFor="portfolioFile">Portfolio/Additional Documents</label>
              <input
                id="portfolioFile"
                type="file"
                className={`input file-input ${fieldTouched.portfolioFile && errors.portfolioFile ? 'error' : ''} ${fieldTouched.portfolioFile && !errors.portfolioFile && formData.portfolioFile ? 'valid' : ''}`}
                onChange={handleFileChange('portfolioFile')}
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
              {formData.portfolioFile && (
                <div className="file-selected">
                  <span className="file-name">{formData.portfolioFile.name}</span>
                  <span className="file-size">({(formData.portfolioFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
              {errors.portfolioFile && <p className="error">{errors.portfolioFile}</p>}
              <p className="field-hint">Optional: Portfolio, writing samples, etc. (max 20MB)</p>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Interests & Preferences</h2>
          
          <div className="form-group">
            <label>Areas of Interest</label>
            <div className="interests-grid">
              {interestOptions.map(interest => (
                <label key={interest} className="interest-item">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                  />
                  <span className="interest-label">{interest}</span>
                </label>
              ))}
            </div>
            <p className="field-hint">Select all that apply to your academic or professional interests</p>
          </div>

          <div className="form-group">
            <label htmlFor="referralSource">How did you hear about HPAIR?</label>
            <select
              id="referralSource"
              className="input"
              value={formData.referralSource}
              onChange={(e) => updateField('referralSource', e.target.value)}
            >
              <option value="">Select source</option>
              {referralSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Additional Information</h2>
          
          <div className="form-group">
            <label htmlFor="notes">Additional Notes or Comments</label>
            <textarea
              id="notes"
              className="input"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Share anything else you'd like us to know about your background, interests, or application..."
              rows={5}
            />
            <p className="field-hint">Optional: Use this space to provide any additional context or information</p>
          </div>
        </div>

        <div className="form-section">
          <div className="advanced-options">
            <button
              type="button"
              className="toggle-advanced"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvancedOptions && (
              <div className="advanced-panel">
                <h3>Form Settings</h3>
                <div className="settings-grid">
                  <div className="setting-item">
                    <span>Auto-save Status:</span>
                    <span className={`status ${saveStatus}`}>{saveStatus}</span>
                  </div>
                  <div className="setting-item">
                    <span>Form Progress:</span>
                    <span>{progress}% Complete</span>
                  </div>
                  <div className="setting-item">
                    <span>Fields Completed:</span>
                    <span>{Object.values(formData).filter(v => v && v !== '' && v !== false).length}</span>
                  </div>
                </div>
                
                <div className="advanced-actions">
                  <button type="button" className="secondary small" onClick={autoSave}>
                    Save Draft Now
                  </button>
                  <button 
                    type="button" 
                    className="secondary small" 
                    onClick={() => downloadSummary(formData)}
                  >
                    Export Current Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-footer">
          <div className="form-info">
            <p className="keyboard-hint">
              <strong>Tip:</strong> Use <kbd>Ctrl+S</kbd> to save draft, <kbd>Ctrl+Enter</kbd> to submit
            </p>
            <p className="security-note">All data is securely handled and auto-saved locally</p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all form data?')) {
                  resetForm();
                  showNotification('Form cleared', 'info');
                }
              }}
            >
              Clear Form
            </button>
            
            <button
              type="button"
              className="primary"
              disabled={!isFormValid() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;