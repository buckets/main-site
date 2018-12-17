/* Generated by Nim Compiler v0.19.1 */
/*   (c) 2018 Andreas Rumpf */
/* The generated code is subject to the original license. */
#define NIM_NEW_MANGLING_RULES
#define NIM_INTBITS 64

#include "nimbase.h"
#include <string.h>
#undef LANGUAGE_C
#undef MIPSEB
#undef MIPSEL
#undef PPC
#undef R3000
#undef R4000
#undef i386
#undef linux
#undef mips
#undef near
#undef far
#undef powerpc
#undef unix
struct NimStringDesc;
struct TGenericSeq;
struct TNimType;
struct TNimNode;
struct tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA;
struct tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw;
struct tyObject_LoggercolonObjectType__9bhietBQiofDPLK3sBa0qPQ;
struct RootObj;
struct tyObject_RollingFileLoggercolonObjectType__RVbeT0aVEu0OfdbVn1KX0g;
struct tyObject_FileLoggercolonObjectType__IRs4hY6GNcXZ1akep9cf7jA;
struct tyObject_ConsoleLoggercolonObjectType__4w707i5soOx7A2LWkxurNA;
struct TGenericSeq {
NI len;
NI reserved;
};
typedef NIM_CHAR tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ[1];
struct NimStringDesc : public TGenericSeq {
tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ data;
};
typedef NU8 tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA;
typedef NU8 tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A;
typedef NU8 tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ;
typedef N_NIMCALL_PTR(void, tyProc_ojoeKfW4VYIm36I9cpDTQIg) (void* p, NI op);
typedef N_NIMCALL_PTR(void*, tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ) (void* p);
struct TNimType {
NI size;
tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A kind;
tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ flags;
TNimType* base;
TNimNode* node;
void* finalizer;
tyProc_ojoeKfW4VYIm36I9cpDTQIg marker;
tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ deepcopy;
};
typedef NimStringDesc* tyArray_8ZvwQIddfpj2THRVPsFzIQ[1];
struct tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw {
char dummy;
};
typedef NU8 tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg;
struct RootObj {
TNimType* m_type;
};
struct tyObject_LoggercolonObjectType__9bhietBQiofDPLK3sBa0qPQ : public RootObj {
tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg levelThreshold;
NimStringDesc* fmtStr;
};
typedef NU8 tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ;
struct TNimNode {
tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ kind;
NI offset;
TNimType* typ;
NCSTRING name;
NI len;
TNimNode** sons;
};
N_NIMCALL(NCSTRING, buckets_version)(void);
N_NIMCALL(NCSTRING, buckets_stringpc)(NCSTRING command, NCSTRING arg, NI arglen);
N_NIMCALL(NimStringDesc*, mnewString)(NI len);
N_NIMCALL(NimStringDesc*, mnewString)(NI len);
static N_INLINE(void, copyMem_E1xtACub5WcDa3vbrIXbwgsystem)(void* dest, void* source, NI size);
static N_INLINE(void, nimCopyMem)(void* dest, void* source, NI size);
N_LIB_PRIVATE N_NIMCALL(tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA, parseEnum_F2m6TxOYlOgS9b1zJlysJMw)(NimStringDesc* s, tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA default_0);
N_NIMCALL(NimStringDesc*, cstrToNimstr)(NCSTRING str);
N_NIMCALL(NimStringDesc*, rawNewString)(NI space);
N_NIMCALL(NimStringDesc*, rawNewString)(NI cap);
static N_INLINE(void, appendString)(NimStringDesc* dest, NimStringDesc* src);
N_NIMCALL(NimStringDesc*, resizeString)(NimStringDesc* dest, NI addlen);
N_NIMCALL(NimStringDesc*, reprStr)(NimStringDesc* s);
static N_INLINE(NCSTRING, nimToCStringConv)(NimStringDesc* s);
N_LIB_PRIVATE N_NIMCALL(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA*, open_SRJkmN7JR2aulOhbafCrYA)(NimStringDesc* connection, NimStringDesc* user, NimStringDesc* password, NimStringDesc* database);
N_NIMCALL(NimStringDesc*, copyString)(NimStringDesc* src);
N_LIB_PRIVATE N_NIMCALL(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw*, setupQuery_6EQAJlzQgp6Lnc8upW20sQ)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc* query, NimStringDesc** args, NI argsLen_0);
static N_INLINE(void, nimZeroMem)(void* p, NI size);
static N_INLINE(void, nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem)(void* a, int v, NI size);
extern "C" N_CDECL(NI32, sqlite3_step)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* para1);
static N_INLINE(NimStringDesc*, X5BX5D__tbPO1SD3BdMzjXgxBZr7Dwbuckets)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* row, NI32 col);
extern "C" N_CDECL(NCSTRING, sqlite3_column_text)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* para1, NI32 iCol);
extern "C" N_CDECL(NI32, sqlite3_finalize)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* pStmt);
N_LIB_PRIVATE N_NIMCALL(void, dbError_yRzNipQFOsKqLVySy7Je9bw)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db) __attribute__((noreturn));
N_NIMCALL(void, chckNilDisp)(void* p);
N_LIB_PRIVATE N_NIMCALL(void, log_rG6osqE0luZSJUlLifxyVg)(tyObject_RollingFileLoggercolonObjectType__RVbeT0aVEu0OfdbVn1KX0g* logger, tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg level, NimStringDesc** args, NI argsLen_0);
static N_INLINE(NIM_BOOL, isObjWithCache)(TNimType* obj, TNimType* subclass, TNimType** cache);
N_LIB_PRIVATE N_NOINLINE(NIM_BOOL, isObjSlowPath_yEa9cUwzxhGRtg9cspcfCIHg)(TNimType* obj, TNimType* subclass, TNimType** cache);
N_LIB_PRIVATE N_NIMCALL(void, log_m2nFIuqvJSzncok28dY8Kg)(tyObject_FileLoggercolonObjectType__IRs4hY6GNcXZ1akep9cf7jA* logger, tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg level, NimStringDesc** args, NI argsLen_0);
N_LIB_PRIVATE N_NIMCALL(void, log_A500h04AJ9cHQgD9ad6BzDYw)(tyObject_ConsoleLoggercolonObjectType__4w707i5soOx7A2LWkxurNA* logger, tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg level, NimStringDesc** args, NI argsLen_0);
N_LIB_PRIVATE N_NIMCALL(void, log_2EMZHteAOCjvMWyiczAS7w)(tyObject_LoggercolonObjectType__9bhietBQiofDPLK3sBa0qPQ* logger, tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg level, NimStringDesc** args, NI argsLen_0);
static N_INLINE(void, initStackBottomWith)(void* locals);
N_NOINLINE(void, nimGC_setStackBottom)(void* theStackBottom);
N_LIB_PRIVATE N_NIMCALL(void, systemInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, systemDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_parseutilsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_parseutilsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_bitopsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_bitopsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_mathInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_mathDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_algorithmInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_algorithmDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_unicodeInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_unicodeDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_strutilsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_strutilsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_sqlite3Init000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_sqlite3DatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_db_commonInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_db_commonDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_db_sqliteInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_db_sqliteDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_typetraitsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_typetraitsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_optionsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_optionsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_macrosInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_macrosDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_strformatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_strformatDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_posixInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_posixDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_timesInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_timesDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_ospathsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_ospathsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_osInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_osDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_loggingInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_loggingDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_sequtilsInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, stdlib_sequtilsDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_dbschemaInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_dbschemaDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_budgetfileInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_budgetfileDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_dbInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, buckets_dbDatInit000)(void);
N_LIB_PRIVATE N_NIMCALL(void, NimMainModule)(void);
N_LIB_PRIVATE N_NIMCALL(void, bucketsDatInit000)(void);
TNimType NTI_1nKXODQf4pVTsjJDOlhgTA_;
extern TNimType NTI_RVbeT0aVEu0OfdbVn1KX0g_;
extern TNimType NTI_IRs4hY6GNcXZ1akep9cf7jA_;
static TNimType* Nim_OfCheck_CACHE11[2];
extern TNimType NTI_4w707i5soOx7A2LWkxurNA_;
extern TNimType NTI_9bhietBQiofDPLK3sBa0qPQ_;
static TNimType* Nim_OfCheck_CACHE12[2];
STRING_LITERAL(TM_N9cGyzi9aEspHXroBx9c4suKA_5, "Foo(", 4);
STRING_LITERAL(TM_N9cGyzi9aEspHXroBx9c4suKA_6, ") executed", 10);
STRING_LITERAL(TM_N9cGyzi9aEspHXroBx9c4suKA_7, ":memory:", 8);
STRING_LITERAL(TM_N9cGyzi9aEspHXroBx9c4suKA_8, "SELECT sqlite_version()", 23);
STRING_LITERAL(TM_N9cGyzi9aEspHXroBx9c4suKA_9, "SQLite version: ", 16);

N_NIMCALL(NCSTRING, buckets_version)(void) {
	NCSTRING result;
	result = (NCSTRING)0;
	result = "0.1.0";
	return result;
}

static N_INLINE(void, nimCopyMem)(void* dest, void* source, NI size) {
	void* T1_;
	T1_ = (void*)0;
	T1_ = memcpy(dest, source, ((size_t) (size)));
}

static N_INLINE(void, copyMem_E1xtACub5WcDa3vbrIXbwgsystem)(void* dest, void* source, NI size) {
	nimCopyMem(dest, source, size);
}

static N_INLINE(void, appendString)(NimStringDesc* dest, NimStringDesc* src) {
	{
		if (!!((src == NIM_NIL))) goto LA3_;
{		copyMem_E1xtACub5WcDa3vbrIXbwgsystem(((void*) ((&(*dest).data[(*dest).len]))), ((void*) ((*src).data)), ((NI) ((NI)((*src).len + ((NI) 1)))));
		(*dest).len += (*src).len;
}	}
	LA3_: ;
}

static N_INLINE(NCSTRING, nimToCStringConv)(NimStringDesc* s) {
	NCSTRING result;
	result = (NCSTRING)0;
	{
		NIM_BOOL T3_;
		T3_ = (NIM_BOOL)0;
		T3_ = (s == NIM_NIL);
		if (T3_) goto LA4_;
		T3_ = ((*s).len == ((NI) 0));
		LA4_: ;
		if (!T3_) goto LA5_;
{		result = "";
}	}
	goto LA1_;
	LA5_: ;
	{
		result = ((NCSTRING) ((*s).data));
	}
	LA1_: ;
	return result;
}

static N_INLINE(void, nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem)(void* a, int v, NI size) {
	void* T1_;
	T1_ = (void*)0;
	T1_ = memset(a, v, ((size_t) (size)));
}

static N_INLINE(void, nimZeroMem)(void* p, NI size) {
	nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem(p, ((int) 0), size);
}

static N_INLINE(NimStringDesc*, X5BX5D__tbPO1SD3BdMzjXgxBZr7Dwbuckets)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* row, NI32 col) {
	NimStringDesc* result;
	NCSTRING T1_;
	result = (NimStringDesc*)0;
	T1_ = (NCSTRING)0;
	T1_ = sqlite3_column_text(row, col);
	result = cstrToNimstr(T1_);
	return result;
}

N_NIMCALL(NCSTRING, buckets_stringpc)(NCSTRING command, NCSTRING arg, NI arglen) {
	NCSTRING result;
	NimStringDesc* fullarg;
	NimStringDesc* T1_;
	result = (NCSTRING)0;
	fullarg = (NimStringDesc*)0;
	fullarg = mnewString(((NI) (arglen)));
	copyMem_E1xtACub5WcDa3vbrIXbwgsystem(((void*) ((&fullarg->data[((NI) 0)]))), ((void*) (arg)), ((NI) (arglen)));
	T1_ = (NimStringDesc*)0;
	T1_ = cstrToNimstr(command);
	tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA cmd = parseEnum_F2m6TxOYlOgS9b1zJlysJMw(T1_, ((tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA) 0));
	switch (cmd) {
	case ((tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA) 1):
	{
		NimStringDesc* fmtRes;
		fmtRes = rawNewString(((NI) 38));
		fmtRes = resizeString(fmtRes, 4);
appendString(fmtRes, ((NimStringDesc*) &TM_N9cGyzi9aEspHXroBx9c4suKA_5));
		fmtRes = resizeString(fmtRes, (reprStr(fullarg) ? reprStr(fullarg)->len : 0) + 0);
appendString(fmtRes, reprStr(fullarg));
		fmtRes = resizeString(fmtRes, 10);
appendString(fmtRes, ((NimStringDesc*) &TM_N9cGyzi9aEspHXroBx9c4suKA_6));
		result = nimToCStringConv(fmtRes);
	}
	break;
	case ((tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA) 2):
	{
		tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db = open_SRJkmN7JR2aulOhbafCrYA(((NimStringDesc*) &TM_N9cGyzi9aEspHXroBx9c4suKA_7), ((NimStringDesc*) NIM_NIL), ((NimStringDesc*) NIM_NIL), ((NimStringDesc*) NIM_NIL));
		{
			tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* row;
			NimStringDesc* colontmp_;
			tyArray_8ZvwQIddfpj2THRVPsFzIQ T5_;
			row = (tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw*)0;
			colontmp_ = (NimStringDesc*)0;
			colontmp_ = copyString(((NimStringDesc*) &TM_N9cGyzi9aEspHXroBx9c4suKA_8));
			nimZeroMem((void*)T5_, sizeof(tyArray_8ZvwQIddfpj2THRVPsFzIQ));
			tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* stmt = setupQuery_6EQAJlzQgp6Lnc8upW20sQ(db, colontmp_, T5_, 0);
			{
				while (1) {
					NI32 T8_;
					NimStringDesc* fmtRes_2;
					NimStringDesc* T9_;
					T8_ = (NI32)0;
					T8_ = sqlite3_step(stmt);
					if (!(T8_ == ((NI32) 100))) goto LA7;
					row = stmt;
					fmtRes_2 = rawNewString(((NI) 34));
					fmtRes_2 = resizeString(fmtRes_2, 16);
appendString(fmtRes_2, ((NimStringDesc*) &TM_N9cGyzi9aEspHXroBx9c4suKA_9));
					T9_ = (NimStringDesc*)0;
					T9_ = X5BX5D__tbPO1SD3BdMzjXgxBZr7Dwbuckets(row, ((NI32) 0));
					fmtRes_2 = resizeString(fmtRes_2, (T9_ ? T9_->len : 0) + 0);
appendString(fmtRes_2, T9_);
					result = nimToCStringConv(fmtRes_2);
				} LA7: ;
			}
			{
				NI32 T12_;
				T12_ = (NI32)0;
				T12_ = sqlite3_finalize(stmt);
				if (!!((T12_ == ((NI32) 0)))) goto LA13_;
{				dbError_yRzNipQFOsKqLVySy7Je9bw(db);
}			}
			LA13_: ;
		}
	}
	break;
	case ((tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA) 0):
	{
		result = "Unknown function";
	}
	break;
	}
	return result;
}

static N_INLINE(NIM_BOOL, isObjWithCache)(TNimType* obj, TNimType* subclass, TNimType** cache) {
	NIM_BOOL result;
{	result = (NIM_BOOL)0;
	{
		if (!(obj == subclass)) goto LA3_;
{		result = NIM_TRUE;
		goto BeforeRet_;
}	}
	LA3_: ;
	{
		if (!((*obj).base == subclass)) goto LA7_;
{		result = NIM_TRUE;
		goto BeforeRet_;
}	}
	LA7_: ;
	{
		if (!(cache[(((NI) 0))- 0] == obj)) goto LA11_;
{		result = NIM_FALSE;
		goto BeforeRet_;
}	}
	LA11_: ;
	{
		if (!(cache[(((NI) 1))- 0] == obj)) goto LA15_;
{		result = NIM_TRUE;
		goto BeforeRet_;
}	}
	LA15_: ;
	result = isObjSlowPath_yEa9cUwzxhGRtg9cspcfCIHg(obj, subclass, cache);
	goto BeforeRet_;
	}BeforeRet_: ;
	return result;
}

N_LIB_PRIVATE N_NIMCALL(void, log_3UB9b0flreHbZSduHV9cBGOA)(tyObject_LoggercolonObjectType__9bhietBQiofDPLK3sBa0qPQ* logger, tyEnum_Level_pW4mH4lipH6u2NKDGEWdGg level, NimStringDesc** args, NI argsLen_0) {
	chckNilDisp(logger);
	{
		if (!((logger) && ((*logger).m_type == (&NTI_RVbeT0aVEu0OfdbVn1KX0g_)))) goto LA3_;
{		log_rG6osqE0luZSJUlLifxyVg(((tyObject_RollingFileLoggercolonObjectType__RVbeT0aVEu0OfdbVn1KX0g*) (logger)), level, args, argsLen_0);
}	}
	goto LA1_;
	LA3_: ;
	{
		if (!((logger) && (isObjWithCache((*logger).m_type, (&NTI_IRs4hY6GNcXZ1akep9cf7jA_), Nim_OfCheck_CACHE11)))) goto LA6_;
{		log_m2nFIuqvJSzncok28dY8Kg(((tyObject_FileLoggercolonObjectType__IRs4hY6GNcXZ1akep9cf7jA*) (logger)), level, args, argsLen_0);
}	}
	goto LA1_;
	LA6_: ;
	{
		if (!((logger) && ((*logger).m_type == (&NTI_4w707i5soOx7A2LWkxurNA_)))) goto LA9_;
{		log_A500h04AJ9cHQgD9ad6BzDYw(((tyObject_ConsoleLoggercolonObjectType__4w707i5soOx7A2LWkxurNA*) (logger)), level, args, argsLen_0);
}	}
	goto LA1_;
	LA9_: ;
	{
		if (!((logger) && (isObjWithCache((*logger).m_type, (&NTI_9bhietBQiofDPLK3sBa0qPQ_), Nim_OfCheck_CACHE12)))) goto LA12_;
{		log_2EMZHteAOCjvMWyiczAS7w(logger, level, args, argsLen_0);
}	}
	goto LA1_;
	LA12_: ;
	LA1_: ;
}

static N_INLINE(void, initStackBottomWith)(void* locals) {
	nimGC_setStackBottom(locals);
}
void PreMainInner(void) {
	systemInit000();
	stdlib_parseutilsDatInit000();
	stdlib_bitopsDatInit000();
	stdlib_mathDatInit000();
	stdlib_algorithmDatInit000();
	stdlib_unicodeDatInit000();
	stdlib_strutilsDatInit000();
	stdlib_sqlite3DatInit000();
	stdlib_db_commonDatInit000();
	stdlib_db_sqliteDatInit000();
	stdlib_typetraitsDatInit000();
	stdlib_optionsDatInit000();
	stdlib_macrosDatInit000();
	stdlib_strformatDatInit000();
	stdlib_posixDatInit000();
	stdlib_timesDatInit000();
	stdlib_ospathsDatInit000();
	stdlib_osDatInit000();
	stdlib_loggingDatInit000();
	stdlib_sequtilsDatInit000();
	buckets_dbschemaDatInit000();
	buckets_budgetfileDatInit000();
	buckets_dbDatInit000();
	bucketsDatInit000();
	stdlib_parseutilsInit000();
	stdlib_bitopsInit000();
	stdlib_mathInit000();
	stdlib_algorithmInit000();
	stdlib_unicodeInit000();
	stdlib_strutilsInit000();
	stdlib_sqlite3Init000();
	stdlib_db_commonInit000();
	stdlib_db_sqliteInit000();
	stdlib_typetraitsInit000();
	stdlib_optionsInit000();
	stdlib_macrosInit000();
	stdlib_strformatInit000();
	stdlib_posixInit000();
	stdlib_timesInit000();
	stdlib_ospathsInit000();
	stdlib_osInit000();
	stdlib_loggingInit000();
	stdlib_sequtilsInit000();
	buckets_dbschemaInit000();
	buckets_budgetfileInit000();
	buckets_dbInit000();
}

void PreMain(void) {
	void (*volatile inner)(void);
	systemDatInit000();
	inner = PreMainInner;
	initStackBottomWith((void *)&inner);
	(*inner)();
}

int cmdCount;
char** cmdLine;
char** gEnv;
N_CDECL(void, NimMainInner)(void) {
	NimMainModule();
}

N_CDECL(void, NimMain)(void) {
	void (*volatile inner)(void);
	PreMain();
	inner = NimMainInner;
	initStackBottomWith((void *)&inner);
	(*inner)();
}

int main(int argc, char** args, char** env) {
	cmdLine = args;
	cmdCount = argc;
	gEnv = env;
	NimMain();
	return nim_program_result;
}

N_LIB_PRIVATE N_NIMCALL(void, NimMainModule)(void) {
{
	TFrame FR_; FR_.len = 0;
}
}

N_LIB_PRIVATE N_NIMCALL(void, bucketsDatInit000)(void) {
static TNimNode* TM_N9cGyzi9aEspHXroBx9c4suKA_2[3];
NI TM_N9cGyzi9aEspHXroBx9c4suKA_4;
static char* NIM_CONST TM_N9cGyzi9aEspHXroBx9c4suKA_3[3] = {
"Unknown", 
"Foo", 
"Bar"};
static TNimNode TM_N9cGyzi9aEspHXroBx9c4suKA_0[4];
NTI_1nKXODQf4pVTsjJDOlhgTA_.size = sizeof(tyEnum_Commands_1nKXODQf4pVTsjJDOlhgTA);
NTI_1nKXODQf4pVTsjJDOlhgTA_.kind = 14;
NTI_1nKXODQf4pVTsjJDOlhgTA_.base = 0;
NTI_1nKXODQf4pVTsjJDOlhgTA_.flags = 3;
for (TM_N9cGyzi9aEspHXroBx9c4suKA_4 = 0; TM_N9cGyzi9aEspHXroBx9c4suKA_4 < 3; TM_N9cGyzi9aEspHXroBx9c4suKA_4++) {
TM_N9cGyzi9aEspHXroBx9c4suKA_0[TM_N9cGyzi9aEspHXroBx9c4suKA_4+0].kind = 1;
TM_N9cGyzi9aEspHXroBx9c4suKA_0[TM_N9cGyzi9aEspHXroBx9c4suKA_4+0].offset = TM_N9cGyzi9aEspHXroBx9c4suKA_4;
TM_N9cGyzi9aEspHXroBx9c4suKA_0[TM_N9cGyzi9aEspHXroBx9c4suKA_4+0].name = TM_N9cGyzi9aEspHXroBx9c4suKA_3[TM_N9cGyzi9aEspHXroBx9c4suKA_4];
TM_N9cGyzi9aEspHXroBx9c4suKA_2[TM_N9cGyzi9aEspHXroBx9c4suKA_4] = &TM_N9cGyzi9aEspHXroBx9c4suKA_0[TM_N9cGyzi9aEspHXroBx9c4suKA_4+0];
}
TM_N9cGyzi9aEspHXroBx9c4suKA_0[3].len = 3; TM_N9cGyzi9aEspHXroBx9c4suKA_0[3].kind = 2; TM_N9cGyzi9aEspHXroBx9c4suKA_0[3].sons = &TM_N9cGyzi9aEspHXroBx9c4suKA_2[0];
NTI_1nKXODQf4pVTsjJDOlhgTA_.node = &TM_N9cGyzi9aEspHXroBx9c4suKA_0[3];
}

