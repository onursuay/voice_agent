'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';
import type { Lead, LeadSourcePlatform } from '@/lib/types';

interface LeadCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const initialForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  company: '',
  city: '',
  source_platform: 'manual' as LeadSourcePlatform,
  stage_id: '',
  assigned_to: '',
};

export function LeadCreateModal({ open, onClose }: LeadCreateModalProps) {
  const stages = useAppStore((s) => s.stages);
  const members = useAppStore((s) => s.members);
  const leads = useAppStore((s) => s.leads);
  const setLeads = useAppStore((s) => s.setLeads);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.first_name.trim() && !form.phone.trim()) {
      setError('Ad veya telefon alani zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          stage_id: form.stage_id || undefined,
          assigned_to: form.assigned_to || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lead olusturulamadi.');
      }

      const newLead: Lead = await res.json();
      setLeads([newLead, ...leads]);
      setForm(initialForm);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const platformOptions = Object.entries(SOURCE_PLATFORM_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const stageOptions = stages.map((s) => ({ value: s.id, label: s.name }));

  const memberOptions = members
    .filter((m) => m.is_active)
    .map((m) => ({
      value: m.user_id,
      label: m.profile?.full_name || m.user_id,
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Lead Olustur"
      description="Yeni bir lead kaydı ekleyin."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Iptal
          </Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Olustur
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ad"
            name="first_name"
            value={form.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Ornek: Ahmet"
          />
          <Input
            label="Soyad"
            name="last_name"
            value={form.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Ornek: Yilmaz"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefon"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+90 5XX XXX XX XX"
          />
          <Input
            label="E-posta"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ornek@firma.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sirket"
            name="company"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Sirket adi"
          />
          <Input
            label="Sehir"
            name="city"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Istanbul"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Kaynak Platform"
            name="source_platform"
            value={form.source_platform}
            onChange={(e) => handleChange('source_platform', e.target.value)}
            options={platformOptions}
          />
          <Select
            label="Aşama"
            name="stage_id"
            value={form.stage_id}
            onChange={(e) => handleChange('stage_id', e.target.value)}
            options={stageOptions}
            placeholder="Aşama seçin"
          />
          <Select
            label="Atanan Kisi"
            name="assigned_to"
            value={form.assigned_to}
            onChange={(e) => handleChange('assigned_to', e.target.value)}
            options={memberOptions}
            placeholder="Kisi secin"
          />
        </div>
      </form>
    </Modal>
  );
}
