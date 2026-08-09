import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter, 
  Flame, 
  CheckCircle2, 
  Timer, 
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface CardItem {
  id: string;
  text: string;
  type: string;
  intensity?: number;
  points?: number;
  timer?: number;
  tags?: string[];
  is_active?: boolean;
}

export const CardsCmsView: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    text: string;
    type: string;
    intensity: number;
    points: number;
    timer: number;
  }>({
    text: '',
    type: 'dare',
    intensity: 2,
    points: 10,
    timer: 45,
  });

  const loadCards = async () => {
    setLoading(true);
    try {
      let query = supabase.from('cards').select('*').order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('type', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCards(data || []);
    } catch (e: any) {
      console.error('Error fetching cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [selectedCategory]);

  const handleOpenAdd = () => {
    setEditingCard(null);
    setFormData({
      text: '',
      type: 'dare',
      intensity: 2,
      points: 10,
      timer: 45,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: CardItem) => {
    setEditingCard(card);
    setFormData({
      text: card.text,
      type: card.type,
      intensity: card.intensity || 2,
      points: card.points || 10,
      timer: card.timer || 45,
    });
    setIsModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!formData.text.trim()) {
      alert('Card prompt text is required');
      return;
    }

    try {
      if (editingCard) {
        // Update
        const { error } = await supabase
          .from('cards')
          .update({
            text: formData.text,
            type: formData.type,
            intensity: formData.intensity,
            points: formData.points,
            timer: formData.timer,
          })
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('cards').insert({
          text: formData.text,
          type: formData.type,
          intensity: formData.intensity,
          points: formData.points,
          timer: formData.timer,
          is_active: true,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      loadCards();
    } catch (err: any) {
      alert(`Failed to save card: ${err.message}`);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dare card?')) return;
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Error deleting card: ${err.message}`);
    }
  };

  const filteredCards = cards.filter((c) =>
    c.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            Game Cards CMS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, edit, and organize all Truth, Dare, Spicy, and Couple prompts synced live to the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadCards} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="gradient" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add New Card
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search dares & truths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'dare', 'truth', 'spicy', 'ldr', 'romantic'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-4 font-semibold">Prompt Text</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Intensity</th>
                  <th className="p-4 font-semibold">Points</th>
                  <th className="p-4 font-semibold">Timer</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading cards from Supabase...
                    </td>
                  </tr>
                ) : filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No cards found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-slate-200 max-w-md">{card.text}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            card.type === 'spicy'
                              ? 'destructive'
                              : card.type === 'dare'
                              ? 'default'
                              : card.type === 'truth'
                              ? 'secondary'
                              : 'neon'
                          }
                        >
                          {card.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-orange-400">
                          {Array.from({ length: card.intensity || 1 }).map((_, i) => (
                            <Flame key={i} className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-emerald-400 font-bold">{card.points || 10} pts</td>
                      <td className="p-4 text-slate-400">{card.timer || 45}s</td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(card)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Card Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCard ? 'Edit Game Card' : 'Create New Game Card'}
        description="Configure the dare/truth prompt, intensity level, and bonus reward points."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Card Prompt Text</label>
            <textarea
              className="w-full h-24 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-md"
              placeholder="e.g. Kiss your partner on their collarbone for 10 seconds..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category / Type</label>
              <select
                className="w-full h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white focus:border-primary focus:outline-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="dare">Dare</option>
                <option value="truth">Truth</option>
                <option value="spicy">Spicy (18+)</option>
                <option value="romantic">Romantic</option>
                <option value="ldr">Long Distance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Intensity (1-3 🔥)</label>
              <select
                className="w-full h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white focus:border-primary focus:outline-none"
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: parseInt(e.target.value) || 1 })}
              >
                <option value={1}>Level 1 (Mild / Cute)</option>
                <option value={2}>Level 2 (Romantic / Flirty)</option>
                <option value={3}>Level 3 (Wild / Intense)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Points Reward</label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Countdown Timer (Seconds)</label>
              <Input
                type="number"
                value={formData.timer}
                onChange={(e) => setFormData({ ...formData, timer: parseInt(e.target.value) || 45 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSaveCard}>
              {editingCard ? 'Save Changes' : 'Create Card'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
