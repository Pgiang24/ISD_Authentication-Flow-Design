// src/components/AddressFields.tsx
// Component dùng chung cho SettingsPage và CheckoutPage
// Tỉnh/Thành, Quận/Huyện, Phường/Xã đều là dropdown có dữ liệu thực
// Tất cả 3 cấp đều bắt buộc nhập

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { PROVINCES, getDistricts, getWards } from "../data/vnAddress";

export interface AddressValue {
  city:     string;
  district: string;
  ward:     string;
  address:  string; // Số nhà / tên đường
}

interface AddressFieldsProps {
  value:    AddressValue;
  onChange: (val: AddressValue) => void;
  errors?:  Partial<Record<keyof AddressValue, string>>;
  // Hiển thị trường số nhà/đường không? (mặc định true)
  showStreet?: boolean;
}

function Select({
  label, value, options, onChange, error, placeholder, disabled = false,
}: {
  label: string; value: string; options: string[]; placeholder: string;
  onChange: (v: string) => void; error?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-10 rounded-xl border bg-gray-50 text-sm outline-none transition-all appearance-none
            focus:bg-white focus:ring-2 focus:ring-[#7C2D12]/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#7C2D12]"}
            ${!value ? "text-gray-400" : "text-gray-900"}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function AddressFields({
  value, onChange, errors = {}, showStreet = true,
}: AddressFieldsProps) {
  const districts = value.city     ? getDistricts(value.city)               : [];
  const wards     = value.district ? getWards(value.city, value.district)   : [];

  // Reset district & ward khi đổi tỉnh
  const handleCity = (city: string) => {
    onChange({ ...value, city, district: "", ward: "" });
  };

  // Reset ward khi đổi quận
  const handleDistrict = (district: string) => {
    onChange({ ...value, district, ward: "" });
  };

  return (
    <div className="space-y-3">
      {/* Số nhà / Tên đường */}
      {showStreet && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số nhà, tên đường <span className="text-red-500">*</span>
          </label>
          <input
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="VD: 123 Đường Láng"
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all
              focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20
              ${errors.address ? "border-red-400 bg-red-50" : "border-gray-200"}
            `}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>
      )}

      {/* 3 dropdown cascade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          label="Tỉnh / Thành phố"
          value={value.city}
          options={PROVINCES}
          placeholder="— Chọn tỉnh/thành —"
          onChange={handleCity}
          error={errors.city}
        />
        <Select
          label="Quận / Huyện"
          value={value.district}
          options={districts}
          placeholder={value.city ? "— Chọn quận/huyện —" : "— Chọn tỉnh trước —"}
          onChange={handleDistrict}
          error={errors.district}
          disabled={!value.city}
        />
        <Select
          label="Phường / Xã"
          value={value.ward}
          options={wards}
          placeholder={value.district ? "— Chọn phường/xã —" : "— Chọn quận trước —"}
          onChange={(ward) => onChange({ ...value, ward })}
          error={errors.ward}
          disabled={!value.district}
        />
      </div>
    </div>
  );
}