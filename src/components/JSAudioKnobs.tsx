"use client";
import React from 'react';

export interface KnobProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Knob: React.FC<KnobProps> = ({ label, ...rest }) => {
  return (
    <label className="flex flex-col items-center gap-1 text-xs">
      {label && <span>{label}</span>}
      <input type="range" className="w-16" {...rest} />
    </label>
  );
};

export default Knob;
