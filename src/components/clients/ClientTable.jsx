import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Mail, Phone, ChevronRight } from "lucide-react";

export default function ClientTable({ clients, onEdit, onDelete }) {
  const navigate = useNavigate();

  if (clients.length === 0) {
    return <div className="text-center py-20"><p className="text-muted-foreground">No clients found</p></div>;
  }

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{client.full_name}</p>
                  {client.notes && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{client.notes}</p>}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="space-y-0.5">
                  {client.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{client.email}</div>}
                  {client.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{client.phone}</div>}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={client.status === "active" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}>
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(client)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(client)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(`/clients/${client.id}`)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}