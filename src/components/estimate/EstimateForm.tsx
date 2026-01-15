import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { yen } from '@/utils/helpers';
import type { Car } from '@/types';

interface EstimateFormProps {
  car: Car | null;
}

interface FormData {
  name: string;
  email: string;
  tel: string;
  contact: string;
  note: string;
}

const EstimateForm = ({ car }: EstimateFormProps) => {
  const router = useRouter();
  const { setEstimate } = useApp();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    tel: '',
    contact: 'メール',
    note: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!car) return;

    const payload = {
      carId: car.id,
      name: formData.name.trim(),
      email: formData.email.trim(),
      tel: formData.tel.trim(),
      contact: formData.contact,
      note: formData.note.trim(),
      createdAt: Date.now(),
    };

    setEstimate(payload);
    router.push('/thanks');
  };

  if (!car) {
    return (
      <div className="p-3">
        <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
          車両が見つかりません。
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3">
        <div className="border border-gray-200 rounded-[14px] p-3 bg-white m-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <div className="text-xs text-muted">対象車両</div>
              <div className="font-extrabold">
                {car.maker} {car.model}（{car.year}）
              </div>
              <div className="text-xs text-muted mt-1">
                {car.region}｜{car.pref} {car.city}
              </div>
            </div>
            <div className="font-extrabold text-base">¥{yen(car.priceYen)}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-3 grid gap-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs text-muted mb-1.5">お名前（必須）</label>
              <input
                type="text"
                name="name"
                required
                placeholder="例：山田 太郎"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">メール（必須）</label>
              <input
                type="email"
                name="email"
                required
                placeholder="example@mail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs text-muted mb-1.5">電話（任意）</label>
              <input
                type="tel"
                name="tel"
                placeholder="090-xxxx-xxxx"
                value={formData.tel}
                onChange={handleChange}
                className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">希望連絡方法</label>
              <select 
                name="contact" 
                value={formData.contact} 
                onChange={handleChange}
                className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
              >
                <option value="メール">メール</option>
                <option value="電話">電話</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">備考（任意）</label>
            <input
              type="text"
              name="note"
              placeholder="例：現車確認希望、下取り相談など"
              value={formData.note}
              onChange={handleChange}
              className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
            />
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap items-center justify-end px-3 pb-3">
          <button
            className="h-10 px-3.5 border border-gray-200 rounded-full bg-white cursor-pointer whitespace-nowrap"
            type="button"
            onClick={() => router.push(`/cars/d-${car.id}/`)}
          >
            車両詳細へ戻る
          </button>
          <button 
            className="h-10 px-3.5 border-0 rounded-full bg-accent text-white font-extrabold cursor-pointer whitespace-nowrap"
            type="submit"
          >
            申し込む
          </button>
        </div>
      </form>
    </>
  );
};

export default EstimateForm;
