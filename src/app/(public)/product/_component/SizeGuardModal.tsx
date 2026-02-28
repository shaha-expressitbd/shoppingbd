import React from 'react';
import Modal from '../../../../components/ui/molecules/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../components/ui/organisms/table';

interface SizeGuardData {
  _id: string;
  name: string;
  headers?: string[];
  table?: string[][];
}

interface SizeGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeGuard: SizeGuardData | null;
}

const SizeGuardModal: React.FC<SizeGuardModalProps> = ({
  isOpen,
  onClose,
  sizeGuard,
}) => {
  if (!sizeGuard) return null;

  const { name, headers = [], table = [] } = sizeGuard;

  return (
    <Modal
      isModalOpen={isOpen}
      onClose={onClose}
      title={name}
      showFooter={false}
      size="lg"
      className="max-w-4xl"
    >
      <div className="w-full overflow-x-auto">
        <Table variant="bordered" showBorder={true}>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} align="center">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} align="center">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
};

export default SizeGuardModal;